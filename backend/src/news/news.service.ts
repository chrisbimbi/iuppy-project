import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NewsEntity } from './news.entity';
import { CreateNewDto } from './dto/create-news.dto';
import { UpdateNewDto } from './dto/update-news.dto';
import { News } from '@shared/types';
import { AudienceResolverService } from './audience-resolver.service';
import { NewsAudienceEntity } from '../v2/interactions/entities/news-audience.entity';
import { PushDeliveryEntity } from '../v2/push/entities/push-delivery.entity';
import { UserDeviceEntity } from '../notifications/entities/user-device.entity';
import { AudienceMode } from '@shared/types/NewsSettings';
import { InteractionEventEntity } from '../v2/interactions/entities/interaction-event.entity';
import { CommunicationsService } from 'src/notifications/communications.service';

/** ✅ Templates preferenciais via .env; mantemos fallback p/ legado */
const NEWS_DEEPLINK_TEMPLATE = process.env.APP_NEWS_DEEPLINK_TEMPLATE || '';
const NEWS_WEBLINK_TEMPLATE = process.env.APP_NEWS_WEBLINK_TEMPLATE || '';
const WEB_BASE_LEGACY = process.env.NEWS_WEB_BASE_URL || process.env.WEBAPP_URL || '';

type Range = { from?: string; to?: string };
type Page = { limit?: number; offset?: number; q?: string };

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(NewsEntity)
    private readonly newsRepo: Repository<NewsEntity>,
    @InjectRepository(NewsAudienceEntity)
    private readonly newsAudienceRepo: Repository<NewsAudienceEntity>,
    @InjectRepository(PushDeliveryEntity)
    private readonly pushDeliveryRepo: Repository<PushDeliveryEntity>,
    @InjectRepository(UserDeviceEntity)
    private readonly userDeviceRepo: Repository<UserDeviceEntity>,
    @InjectRepository(InteractionEventEntity)
    private readonly interactionEventRepo: Repository<InteractionEventEntity>,
    private readonly audienceResolverService: AudienceResolverService,
    private readonly comm: CommunicationsService,
  ) {}

  // ----------
  // Helpers
  // ----------
  private n(v: any, d = 0) { const x = Number(v); return Number.isFinite(x) ? x : d; }

  private async tableExists(name: string): Promise<boolean> {
    const r = await this.newsRepo.manager.query(`SELECT to_regclass($1) IS NOT NULL AS x`, [`public.${name}`]);
    return !!r?.[0]?.x;
  }

  private rangeWhere(column: string, r?: Range) {
    const clauses: string[] = [];
    const params: any[] = [];
    if (r?.from) { clauses.push(`${column} >= $${params.length + 1}`); params.push(r.from); }
    if (r?.to)   { clauses.push(`${column} <= $${params.length + 1}`); params.push(r.to); }
    return { sql: clauses.length ? ` AND ${clauses.join(' AND ')}` : '', params };
  }

  private searchWhere(q?: string) {
    if (!q || !q.trim()) return { sql: '', params: [] as any[] };
    return {
      sql: ` WHERE (COALESCE(u."name",'') ILIKE $1 OR COALESCE(u."email",'') ILIKE $1)`,
      params: [`%${q.trim()}%`],
    };
  }

  // ----------
  // CRUD básico
  // ----------
  async create(dto: CreateNewDto): Promise<News> {
    const entity = this.newsRepo.create({
      ...dto,
      attachments: dto.attachments?.map(a => a.url) ?? [],
      highlightImages: dto.highlightImages?.map(i => i.url) ?? [],
    });
    return this.newsRepo.save(entity);
  }

  async findAll(channelId?: string): Promise<News[]> {
    if (channelId) {
      return this.newsRepo.find({ where: { channelId } });
    }
    return this.newsRepo.find();
  }

  async findOne(id: string): Promise<News | null> {
    return this.newsRepo.findOneBy({ id });
  }

  async update(id: string, dto: UpdateNewDto): Promise<News> {
    const toUpdate: any = { ...dto };
    if (dto.attachments) {
      toUpdate.attachments = dto.attachments.map(a => a.url);
    }
    if (dto.highlightImages) {
      toUpdate.highlightImages = dto.highlightImages.map(i => i.url);
    }
    await this.newsRepo.update(id, toUpdate);
    return this.findOne(id) as Promise<News>;
  }

  async remove(id: string): Promise<void> {
    await this.newsRepo.delete(id);
  }

  // ----------
  // Publicação + reenvio (mantido)
  // ----------
  async publish(newsId: string, companyId: string): Promise<News> {
    const news = await this.newsRepo.findOneBy({ id: newsId, companyId });
    if (!news) throw new NotFoundException(`News with ID ${newsId} not found.`);
    if (news.isPublished) throw new Error('News is already published.');

    const { audienceMode, audienceSpaceId, audienceChannelIds, audienceGroupIds } = news.settings || {};
    if (!audienceMode) throw new Error('Audience mode not set for this news.');

    const params: Record<string, any> = {};
    if (audienceSpaceId) params.spaceId = audienceSpaceId;
    if (audienceChannelIds) params.channelIds = audienceChannelIds;
    if (audienceGroupIds) params.groupIds = audienceGroupIds;

    // 1) Probe e snapshot
    const audienceProbeResult = await this.audienceResolverService.probe(
      companyId,
      audienceMode as AudienceMode,
      params,
    );

    news.settings = {
      ...(news.settings || {}),
      audienceSnapshot: {
        totalUsuarios: audienceProbeResult.totalUsuarios,
        comTokenAtivo: audienceProbeResult.comTokenAtivo,
        mode: audienceMode,
        identifiers: params,
      },
    } as any;

    news.isPublished = true;
    news.publishedAt = new Date();

    // 2) Materializar audiência
    const eligibleUserIds = await this.audienceResolverService.resolve(companyId, audienceMode as AudienceMode, params);
    const newsAudienceEntities = eligibleUserIds.map(userId =>
      this.newsAudienceRepo.create({
        companyId,
        newsId,
        userId,
        origemDaRegra: audienceMode as AudienceMode,
      }),
    );

    await this.newsRepo.manager.transaction(async tx => {
      await tx.save(news);
      for (const audienceEntity of newsAudienceEntities) {
        try { await tx.save(audienceEntity); } catch { /* ignore duplicadas */ }
      }
    });

    // 3) Enfileirar registros de push_delivery (status queued)
    const usersWithActiveTokens = await this.userDeviceRepo
      .createQueryBuilder('device')
      .select('DISTINCT device.userId', 'userId')
      .where('(device.companyId = :companyId OR device.companyId IS NULL)', { companyId })
      .andWhere('device.userId IN (:...eligibleUserIds)', { eligibleUserIds })
      .andWhere('device.enabled = :enabled', { enabled: true })
      .getRawMany();

    const pushDeliveries = usersWithActiveTokens.map((u: any) =>
      this.pushDeliveryRepo.create({
        companyId,
        newsId,
        userId: u.userId,
        status: 'queued',
        channel: 'news_publish',
      }),
    );
    await this.pushDeliveryRepo.save(pushDeliveries);

    return news;
  }

  async resendToUnopened(
    newsId: string,
    companyId: string,
    payload?: { pushTitle?: string; pushContent?: string },
  ): Promise<{ sent?: number; requested?: number }> {
    const news = await this.newsRepo.findOneBy({ id: newsId, companyId });
    if (!news) throw new NotFoundException(`News with ID ${newsId} not found.`);
    if (!news.isPublished) throw new BadRequestException('News must be published to be resent.');

    // audiência original
    const originalAudience = await this.newsAudienceRepo.find({
      where: { newsId, companyId },
      select: ['userId'],
    });
    const originalUserIds = originalAudience.map(na => na.userId);
    if (!originalUserIds.length) return { sent: 0, requested: 0 };

    // quem abriu
    const openedUsers = await this.interactionEventRepo.find({
      where: { newsId, companyId, type: 'OPEN', userId: In(originalUserIds) },
      select: ['userId'],
    });
    const openedSet = new Set(openedUsers.map(e => e.userId));

    // alvo: não abertos
    const targetIds = originalUserIds.filter(id => !openedSet.has(id));
    if (!targetIds.length) return { sent: 0, requested: 0 };

    // payload do push
    const title =
      (payload?.pushTitle?.trim()?.length ? payload.pushTitle : (news.settings?.pushTitle ?? news.title))
      || 'Novo conteúdo';
    const body =
      (payload?.pushContent?.trim()?.length ? payload.pushContent : (news.settings?.pushContent ?? news.subtitle))
      || '';
    const imageUrl =
      (Array.isArray(news.highlightImages) && news.highlightImages.length)
        ? news.highlightImages[0]
        : undefined;

    // deeplink/web
    const deepLinkMobile =
      (NEWS_DEEPLINK_TEMPLATE ? NEWS_DEEPLINK_TEMPLATE.replace(':id', news.id) : undefined);

    const webLink =
      (NEWS_WEBLINK_TEMPLATE
        ? NEWS_WEBLINK_TEMPLATE.replace(':id', news.id)
        : (WEB_BASE_LEGACY
          ? `${WEB_BASE_LEGACY.replace(/\/+$/, '')}/news/article/${news.id}`
          : undefined));

    const res = await this.comm.sendNewsPush({
      companyId,
      newsId: news.id,
      userIds: targetIds,
      title,
      body,
      imageUrl,
      deepLinkMobile,
      webLink,
    });

    return { sent: res?.success ?? 0, requested: res?.requested ?? targetIds.length };
  }

  async listUnopenedUsers(
    newsId: string,
    companyId: string,
  ): Promise<Array<{ id: string; name?: string | null; email?: string | null }>> {
    const news = await this.newsRepo.findOneBy({ id: newsId, companyId });
    if (!news) throw new NotFoundException('News not found');

    const eligibleRows = await this.newsAudienceRepo.find({
      where: { newsId, companyId },
      select: ['userId'],
    });
    const eligibleIds = eligibleRows.map(r => r.userId);
    if (!eligibleIds.length) return [];

    const openedRows = await this.interactionEventRepo.find({
      where: { newsId, companyId, type: 'OPEN', userId: In(eligibleIds) },
      select: ['userId'],
    });
    const opened = new Set(openedRows.map(r => r.userId));

    const unopened = eligibleIds.filter(id => !opened.has(id));
    if (!unopened.length) return [];

    const users = await this.newsRepo.manager.query(
      `SELECT id, name, email FROM user_entity WHERE id = ANY($1::uuid[])`,
      [unopened],
    );

    const foundMap = new Map<string, { id: string; name?: string | null; email?: string | null }>();
    for (const u of users || []) foundMap.set(u.id, { id: u.id, name: u.name ?? null, email: u.email ?? null });

    return unopened.map(id => foundMap.get(id) || ({ id, name: null, email: null }));
  }

  // ----------
  // 🔥 NOVOS: Listas por usuário (para modais/exports)
  // ----------

  /** Quem ABRIU (com contagem e datas) */
  async listOpenedUsers(
    newsId: string,
    companyId: string,
    r?: Range,
    p?: Page,
  ): Promise<Array<{ id: string; name: string | null; email: string | null; opensCount: number; firstOpenAt: string | null; lastOpenAt: string | null }>> {
    const range = this.rangeWhere(`e."createdAt"`, r);
    const limit = Math.max(0, this.n(p?.limit ?? 200));
    const offset = Math.max(0, this.n(p?.offset ?? 0));
    const search = this.searchWhere(p?.q);

    const params: any[] = [companyId, newsId, ...range.params];
    const baseIdx = params.length;

    // search WHERE precisa ser aplicado após o JOIN com usuário
    const sql =
      `WITH agg AS (
         SELECT e."userId" AS "userId",
                COUNT(*)::int AS "opensCount",
                MIN(e."createdAt") AS "firstOpenAt",
                MAX(e."createdAt") AS "lastOpenAt"
           FROM news_interaction_event e
          WHERE e."companyId"=$1 AND e."newsId"=$2 AND e."type"='OPEN'${range.sql}
          GROUP BY e."userId"
       )
       SELECT a."userId" AS "id",
              u."name" AS "name",
              u."email" AS "email",
              a."opensCount",
              a."firstOpenAt",
              a."lastOpenAt"
         FROM agg a
         LEFT JOIN user_entity u ON u."id"=a."userId"
        ${search.sql}
        ORDER BY a."lastOpenAt" DESC
        LIMIT $${baseIdx + search.params.length + 1}
       OFFSET $${baseIdx + search.params.length + 2}`;

    const rows = await this.newsRepo.manager.query(sql, [...params, ...search.params, limit, offset]);
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name ?? null,
      email: r.email ?? null,
      opensCount: this.n(r.openscount),
      firstOpenAt: r.firstopenat ?? null,
      lastOpenAt: r.lastopenat ?? null,
    }));
  }

  /** Quem deu ACK (se houver) */
  async listAcknowledgedUsers(
    newsId: string,
    companyId: string,
    r?: Range,
    p?: Page,
  ): Promise<Array<{ id: string; name: string | null; email: string | null; ackAt: string | null }>> {
    const range = this.rangeWhere(`e."createdAt"`, r);
    const limit = Math.max(0, this.n(p?.limit ?? 200));
    const offset = Math.max(0, this.n(p?.offset ?? 0));
    const search = this.searchWhere(p?.q);

    const params: any[] = [companyId, newsId, ...range.params];
    const baseIdx = params.length;

    const sql =
      `WITH agg AS (
         SELECT e."userId" AS "userId",
                MAX(e."createdAt") AS "ackAt"
           FROM news_interaction_event e
          WHERE e."companyId"=$1 AND e."newsId"=$2 AND e."type"='ACK'${range.sql}
          GROUP BY e."userId"
       )
       SELECT a."userId" AS "id",
              u."name" AS "name",
              u."email" AS "email",
              a."ackAt"
         FROM agg a
         LEFT JOIN user_entity u ON u."id"=a."userId"
        ${search.sql}
        ORDER BY a."ackAt" DESC NULLS LAST
        LIMIT $${baseIdx + search.params.length + 1}
       OFFSET $${baseIdx + search.params.length + 2}`;

    const rows = await this.newsRepo.manager.query(sql, [...params, ...search.params, limit, offset]);
    return rows.map((r: any) => ({
      id: r.id, name: r.name ?? null, email: r.email ?? null, ackAt: r.ackat ?? null,
    }));
  }

  /** Quem REAGIU (contagem e última reação); tolera ausência da tabela */
  async listReactedUsers(
    newsId: string,
    companyId: string,
    r?: Range,
    p?: Page,
  ): Promise<Array<{ id: string; name: string | null; email: string | null; reactionsCount: number; lastReactionAt: string | null }>> {
    const exists = await this.tableExists('news_reaction');
    if (!exists) return [];
    const range = this.rangeWhere(`r."createdAt"`, r);
    const limit = Math.max(0, this.n(p?.limit ?? 200));
    const offset = Math.max(0, this.n(p?.offset ?? 0));
    const search = this.searchWhere(p?.q);

    const params: any[] = [companyId, newsId, ...range.params];
    const baseIdx = params.length;

    const sql =
      `WITH agg AS (
         SELECT r."userId" AS "userId",
                COUNT(*)::int AS "reactionsCount",
                MAX(r."createdAt") AS "lastReactionAt"
           FROM news_reaction r
          WHERE r."companyId"=$1 AND r."newsId"=$2${range.sql}
          GROUP BY r."userId"
       )
       SELECT a."userId" AS "id",
              u."name" AS "name",
              u."email" AS "email",
              a."reactionsCount",
              a."lastReactionAt"
         FROM agg a
         LEFT JOIN user_entity u ON u."id"=a."userId"
        ${search.sql}
        ORDER BY a."lastReactionAt" DESC NULLS LAST
        LIMIT $${baseIdx + search.params.length + 1}
       OFFSET $${baseIdx + search.params.length + 2}`;

    const rows = await this.newsRepo.manager.query(sql, [...params, ...search.params, limit, offset]);
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name ?? null,
      email: r.email ?? null,
      reactionsCount: this.n(r.reactionscount),
      lastReactionAt: r.lastreactionat ?? null,
    }));
  }

  /** Quem COMENTOU (contagem e última data); tolera ausência da tabela */
  async listCommentedUsers(
    newsId: string,
    companyId: string,
    r?: Range,
    p?: Page,
  ): Promise<Array<{ id: string; name: string | null; email: string | null; commentsCount: number; lastCommentAt: string | null }>> {
    const exists = await this.tableExists('news_comment');
    if (!exists) return [];
    const range = this.rangeWhere(`c."createdAt"`, r);
    const limit = Math.max(0, this.n(p?.limit ?? 200));
    const offset = Math.max(0, this.n(p?.offset ?? 0));
    const search = this.searchWhere(p?.q);

    const params: any[] = [companyId, newsId, ...range.params];
    const baseIdx = params.length;

    const sql =
      `WITH agg AS (
         SELECT c."userId" AS "userId",
                COUNT(*)::int AS "commentsCount",
                MAX(c."createdAt") AS "lastCommentAt"
           FROM news_comment c
          WHERE c."companyId"=$1 AND c."newsId"=$2${range.sql}
          GROUP BY c."userId"
       )
       SELECT a."userId" AS "id",
              u."name" AS "name",
              u."email" AS "email",
              a."commentsCount",
              a."lastCommentAt"
         FROM agg a
         LEFT JOIN user_entity u ON u."id"=a."userId"
        ${search.sql}
        ORDER BY a."lastCommentAt" DESC NULLS LAST
        LIMIT $${baseIdx + search.params.length + 1}
       OFFSET $${baseIdx + search.params.length + 2}`;

    const rows = await this.newsRepo.manager.query(sql, [...params, ...search.params, limit, offset]);
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name ?? null,
      email: r.email ?? null,
      commentsCount: this.n(r.commentscount),
      lastCommentAt: r.lastcommentat ?? null,
    }));
  }

  /** Quem COMPARTILHOU (contagem e última data); tolera ausência da tabela */
  async listSharedUsers(
    newsId: string,
    companyId: string,
    r?: Range,
    p?: Page,
  ): Promise<Array<{ id: string; name: string | null; email: string | null; sharesCount: number; lastShareAt: string | null }>> {
    const exists = await this.tableExists('news_share');
    if (!exists) return [];
    const range = this.rangeWhere(`s."createdAt"`, r);
    const limit = Math.max(0, this.n(p?.limit ?? 200));
    const offset = Math.max(0, this.n(p?.offset ?? 0));
    const search = this.searchWhere(p?.q);

    const params: any[] = [companyId, newsId, ...range.params];
    const baseIdx = params.length;

    const sql =
      `WITH agg AS (
         SELECT s."userId" AS "userId",
                COUNT(*)::int AS "sharesCount",
                MAX(s."createdAt") AS "lastShareAt"
           FROM news_share s
          WHERE s."companyId"=$1 AND s."newsId"=$2${range.sql}
          GROUP BY s."userId"
       )
       SELECT a."userId" AS "id",
              u."name" AS "name",
              u."email" AS "email",
              a."sharesCount",
              a."lastShareAt"
         FROM agg a
         LEFT JOIN user_entity u ON u."id"=a."userId"
        ${search.sql}
        ORDER BY a."lastShareAt" DESC NULLS LAST
        LIMIT $${baseIdx + search.params.length + 1}
       OFFSET $${baseIdx + search.params.length + 2}`;

    const rows = await this.newsRepo.manager.query(sql, [...params, ...search.params, limit, offset]);
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name ?? null,
      email: r.email ?? null,
      sharesCount: this.n(r.sharescount),
      lastShareAt: r.lastshareat ?? null,
    }));
  }
}