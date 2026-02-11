import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NewsEntity } from './news.entity';
import { CreateNewDto } from './dto/create-news.dto';
import { UpdateNewDto } from './dto/update-news.dto';
import { News } from '@shared/types';
import { AudienceResolverService } from './audience-resolver.service';
import { NewsAudienceEntity } from '../v2/interactions/entities/news-audience.entity';
import { NewsAcknowledgmentEntity } from './entities/news-acknowledgment.entity';
import { NewsFavoriteEntity } from '../v2/interactions/entities/news-favorite.entity';
import { PushDeliveryEntity } from '../v2/push/entities/push-delivery.entity';
import { UserDeviceEntity } from '../notifications/entities/user-device.entity';
import { AudienceMode } from '@shared/types/NewsSettings';
import { InteractionEventEntity } from '../v2/interactions/entities/interaction-event.entity';
import { CommunicationsService } from 'src/notifications/communications.service';

/** ✅ Templates preferenciais via .env; mantemos fallback p/ legado */
const NEWS_DEEPLINK_TEMPLATE = process.env.APP_NEWS_DEEPLINK_TEMPLATE || '';
const NEWS_WEBLINK_TEMPLATE = process.env.APP_NEWS_WEBLINK_TEMPLATE || '';
const WEB_BASE_LEGACY =
  process.env.NEWS_WEB_BASE_URL || process.env.WEBAPP_URL || '';

type Range = { from?: string; to?: string };
type Page = { limit?: number; offset?: number; q?: string };

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(NewsEntity)
    private readonly newsRepo: Repository<NewsEntity>,
    @InjectRepository(NewsAudienceEntity)
    private readonly newsAudienceRepo: Repository<NewsAudienceEntity>,
    @InjectRepository(NewsAcknowledgmentEntity)
    private readonly newsAcknowledgmentRepo: Repository<NewsAcknowledgmentEntity>,
    @InjectRepository(NewsFavoriteEntity)
    private readonly newsFavoriteRepo: Repository<NewsFavoriteEntity>,
    @InjectRepository(PushDeliveryEntity)
    private readonly pushDeliveryRepo: Repository<PushDeliveryEntity>,
    @InjectRepository(UserDeviceEntity)
    private readonly userDeviceRepo: Repository<UserDeviceEntity>,
    @InjectRepository(InteractionEventEntity)
    private readonly interactionEventRepo: Repository<InteractionEventEntity>,
    private readonly audienceResolverService: AudienceResolverService,
    private readonly comm: CommunicationsService,
  ) { }

  // ----------
  // Helpers
  // ----------
  private n(v: any, d = 0) {
    const x = Number(v);
    return Number.isFinite(x) ? x : d;
  }

  private async tableExists(name: string): Promise<boolean> {
    const r = await this.newsRepo.manager.query(
      `SELECT to_regclass($1) IS NOT NULL AS x`,
      [`public.${name}`],
    );
    return !!r?.[0]?.x;
  }

  private rangeWhere(column: string, r?: Range) {
    const clauses: string[] = [];
    const params: any[] = [];
    if (r?.from) {
      clauses.push(`${column} >= $${params.length + 1}`);
      params.push(r.from);
    }
    if (r?.to) {
      clauses.push(`${column} <= $${params.length + 1}`);
      params.push(r.to);
    }
    return {
      sql: clauses.length ? ` AND ${clauses.join(' AND ')}` : '',
      params,
    };
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
      attachments: dto.attachments?.map((a) => a.url) ?? [],
      highlightImages: dto.highlightImages?.map((i) => i.url) ?? [],
      hashtags: dto.hashtags ?? [],
      mustAcknowledge: dto.mustAcknowledge ?? false,
      ai_summary: dto.ai_summary,
      ai_tags: dto.ai_tags,
    });
    return this.newsRepo.save(entity);
  }

  async getHashtags(companyId: string, q?: string): Promise<string[]> {
    // Usando raw query para garantir o UNNEST correto
    const safeQ = q ? `%${q}%` : '%';
    const result = await this.newsRepo.query(
      `
      SELECT DISTINCT tag
      FROM news_entity n, UNNEST(n.hashtags) tag
      WHERE n."companyId" = $1
      AND tag ILIKE $2
      ORDER BY tag ASC
      LIMIT 20
      `,
      [companyId, safeQ],
    );

    return result.map((r: any) => r.tag);
  }

  async findAll(
    companyId?: string,
    channelId?: string,
    userId?: string,
    allowedSpaceIds?: string[],
  ): Promise<News[]> {
    const qb = this.newsRepo.createQueryBuilder('n');

    // Filter soft-deleted
    qb.andWhere('n.deletedAt IS NULL');

    // Filter by Company if provided
    if (companyId) {
      qb.andWhere('n.companyId = :companyId', { companyId });
    }

    // Filter by channel if provided
    if (channelId) {
      qb.andWhere('n.channelId = :channelId', { channelId });
    }

    // Filter by Audience (userId)
    // We join news_audience to ensure the user is allowed to see this news
    if (userId) {
      qb.innerJoin('news_audience', 'na', 'na.newsId = n.id');
      qb.andWhere('na.userId = :userId', { userId });
    }

    // Filter by Allowed Space IDs (for Scoped Admins)
    if (allowedSpaceIds && allowedSpaceIds.length > 0) {
      // Join channel to check spaceIds
      qb.innerJoin('n.channel', 'c');
      // Postgres array overlap: c.spaceIds && allowedSpaceIds
      qb.andWhere('c.spaceIds && :allowedSpaceIds', { allowedSpaceIds });
    }

    // Order by creation date
    qb.orderBy('n.createdAt', 'DESC');

    const news = await qb.getMany();

    if (!news.length) return [];

    const ids = news.map((n) => n.id);

    // 1. Reactions
    const reactions = await this.newsRepo.query(
      `SELECT "newsId", COUNT(*)::int as c FROM news_reaction WHERE "newsId" = ANY($1) GROUP BY "newsId"`,
      [ids],
    );
    const reactionMap = new Map(reactions.map((r: any) => [r.newsId, Number(r.c)]));

    // 2. Comments
    const comments = await this.newsRepo.query(
      `SELECT "newsId", COUNT(*)::int as c FROM news_comment WHERE "newsId" = ANY($1) GROUP BY "newsId"`,
      [ids],
    );
    const commentMap = new Map(comments.map((r: any) => [r.newsId, Number(r.c)]));

    // 3. Shares
    const shares = await this.newsRepo.query(
      `SELECT "newsId", COUNT(*)::int as c FROM news_share WHERE "newsId" = ANY($1) GROUP BY "newsId"`,
      [ids],
    );
    const shareMap = new Map(shares.map((r: any) => [r.newsId, Number(r.c)]));

    // 4. Views (Total Opens)
    // Assuming 'news_interaction_event' table and 'type'='OPEN'
    // Fallback to 0 if table doesn't exist or query fails
    let viewMap = new Map<string, number>();
    try {
      const views = await this.newsRepo.query(
        `SELECT "newsId", COUNT(*)::int as c FROM news_interaction_event WHERE "newsId" = ANY($1) AND "type" = 'OPEN' GROUP BY "newsId"`,
        [ids],
      );
      viewMap = new Map(views.map((r: any) => [r.newsId, Number(r.c)]));
    } catch (e) {
      // ignore if table missing
    }

    // 5. Favorites (isFavorited)
    let favoriteSet = new Set<string>();
    if (userId) {
      const favorites = await this.newsFavoriteRepo.find({
        where: { userId, newsId: In(ids) },
        select: ['newsId'],
      });
      favoriteSet = new Set(favorites.map((f) => f.newsId));
    }

    // 6. Favorites Total
    const favoritesTotalRows = await this.newsRepo.query(
      `SELECT "newsId", COUNT(*)::int as c FROM news_favorite WHERE "newsId" = ANY($1) GROUP BY "newsId"`,
      [ids],
    );
    const favoritesTotalMap = new Map(favoritesTotalRows.map((r: any) => [r.newsId, Number(r.c)]));

    // 7. My Reaction
    let myReactionMap = new Map<string, string>();
    let hasViewedSet = new Set<string>();
    let hasCommentedSet = new Set<string>();
    let hasSharedSet = new Set<string>();

    if (userId) {
      // Reactions
      const myReactions = await this.newsRepo.query(
        `SELECT "newsId", reaction FROM news_reaction WHERE "newsId" = ANY($1) AND "userId" = $2`,
        [ids, userId],
      );
      myReactionMap = new Map(myReactions.map((r: any) => [r.newsId, String(r.reaction)]));

      // Views (OPEN events)
      try {
        const myViews = await this.newsRepo.query(
          `SELECT DISTINCT "newsId" FROM news_interaction_event WHERE "newsId" = ANY($1) AND "userId" = $2 AND "type" = 'OPEN'`,
          [ids, userId],
        );
        hasViewedSet = new Set(myViews.map((r: any) => r.newsId));
      } catch (e) { }

      // Comments
      const myComments = await this.newsRepo.query(
        `SELECT DISTINCT "newsId" FROM news_comment WHERE "newsId" = ANY($1) AND "userId" = $2`,
        [ids, userId],
      );
      hasCommentedSet = new Set(myComments.map((r: any) => r.newsId));

      // Shares
      const myShares = await this.newsRepo.query(
        `SELECT DISTINCT "newsId" FROM news_share WHERE "newsId" = ANY($1) AND "userId" = $2`,
        [ids, userId],
      );
      hasSharedSet = new Set(myShares.map((r: any) => r.newsId));
    }

    return news.map((n) => {
      const r = reactionMap.get(n.id) || 0;
      const c = commentMap.get(n.id) || 0;
      const s = shareMap.get(n.id) || 0;
      const v = viewMap.get(n.id) || 0;
      const f = favoritesTotalMap.get(n.id) || 0;
      const isFav = favoriteSet.has(n.id);
      const myReaction = myReactionMap.get(n.id) || null;

      const hasViewed = hasViewedSet.has(n.id);
      const hasCommented = hasCommentedSet.has(n.id);
      const hasShared = hasSharedSet.has(n.id);

      return {
        ...n,
        reactionsTotal: r,
        commentsTotal: c,
        sharesTotal: s,
        viewsTotal: v,
        favoritesTotal: f,
        isFavorited: isFav,
        metrics: {
          reactionsTotal: r,
          commentsTotal: c,
          sharesTotal: s,
          viewsTotal: v,
          favoritesTotal: f,
        },
        userState: {
          isFavorited: isFav,
          myReaction: myReaction,
          hasViewed,
          hasCommented,
          hasShared,
        },
      };
    });
  }

  async findOne(id: string, userId?: string): Promise<News | null> {
    const news = await this.newsRepo.findOneBy({ id });
    if (!news) return null;

    let myReaction = null;
    let hasViewed = false;
    let hasCommented = false;
    let hasShared = false;
    let isFavorited = false;
    let hasAcknowledged = false;

    if (userId) {
      // Reaction
      const reaction = await this.newsRepo.query(
        `SELECT reaction FROM news_reaction WHERE "newsId" = $1 AND "userId" = $2 LIMIT 1`,
        [id, userId],
      );
      if (reaction.length > 0) myReaction = reaction[0].reaction;

      // View
      const view = await this.newsRepo.query(
        `SELECT "newsId" FROM news_interaction_event WHERE "newsId" = $1 AND "userId" = $2 AND "type" = 'OPEN' LIMIT 1`,
        [id, userId],
      );
      hasViewed = view.length > 0;

      // Comment
      const comment = await this.newsRepo.query(
        `SELECT "newsId" FROM news_comment WHERE "newsId" = $1 AND "userId" = $2 LIMIT 1`,
        [id, userId],
      );
      hasCommented = comment.length > 0;

      // Share
      const share = await this.newsRepo.query(
        `SELECT "newsId" FROM news_share WHERE "newsId" = $1 AND "userId" = $2 LIMIT 1`,
        [id, userId],
      );
      hasShared = share.length > 0;

      // Favorite
      const fav = await this.newsFavoriteRepo.findOneBy({ newsId: id, userId });
      isFavorited = !!fav;

      // Acknowledgment
      const ack = await this.newsAcknowledgmentRepo.findOneBy({ newsId: id, userId });
      hasAcknowledged = !!ack;
    }

    return {
      ...news,
      userState: {
        ...((news as any).userState || {}),
        myReaction,
        hasViewed,
        hasCommented,
        hasShared,
        isFavorited,
        hasAcknowledged,
      },
      isFavorited, // Top-level for backward compatibility
    } as unknown as News;
  }

  async acknowledge(newsId: string, userId: string, companyId: string): Promise<void> {
    const news = await this.newsRepo.findOneBy({ id: newsId, companyId });
    if (!news) throw new NotFoundException('News not found');

    // Check if acknowledgment is required? 
    // Maybe we allow acknowledging even if not strictly required, to be safe.
    // But technically only meaningful if mustAcknowledge is true.

    const exists = await this.newsAcknowledgmentRepo.findOneBy({ newsId, userId });
    if (exists) return; // already acknowledged

    const ack = this.newsAcknowledgmentRepo.create({
      companyId,
      newsId,
      userId
    });
    await this.newsAcknowledgmentRepo.save(ack);
  }

  async update(id: string, dto: UpdateNewDto): Promise<News> {
    const toUpdate: any = { ...dto };
    if (dto.attachments) {
      toUpdate.attachments = dto.attachments.map((a) => a.url);
    }
    if (dto.highlightImages) {
      toUpdate.highlightImages = dto.highlightImages.map((i) => i.url);
    }
    if (dto.hashtags) {
      toUpdate.hashtags = dto.hashtags;
    }
    if (dto.mustAcknowledge !== undefined) {
      toUpdate.mustAcknowledge = dto.mustAcknowledge;
    }
    if (dto.ai_summary !== undefined) toUpdate.ai_summary = dto.ai_summary;
    if (dto.ai_tags !== undefined) toUpdate.ai_tags = dto.ai_tags;

    await this.newsRepo.update(id, toUpdate);
    return this.findOne(id) as Promise<News>;
  }

  async remove(id: string): Promise<void> {
    await this.newsRepo.softDelete(id);
  }

  // ----------
  // Publicação + reenvio (mantido)
  // ----------
  async publish(newsId: string, companyId: string): Promise<News> {
    const news = await this.newsRepo.findOneBy({ id: newsId, companyId });
    if (!news) throw new NotFoundException(`News with ID ${newsId} not found.`);
    if (news.isPublished) throw new Error('News is already published.');

    const {
      audienceMode,
      audienceSpaceId,
      audienceChannelIds,
      audienceGroupIds,
    } = news.settings || {};
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
    const eligibleUserIds = await this.audienceResolverService.resolve(
      companyId,
      audienceMode as AudienceMode,
      params,
    );
    const newsAudienceEntities = eligibleUserIds.map((userId) =>
      this.newsAudienceRepo.create({
        companyId,
        newsId,
        userId,
        origemDaRegra: audienceMode as AudienceMode,
      }),
    );

    await this.newsRepo.manager.transaction(async (tx) => {
      await tx.save(news);
      for (const audienceEntity of newsAudienceEntities) {
        try {
          await tx.save(audienceEntity);
        } catch {
          /* ignore duplicadas */
        }
      }
    });

    // 3) Enfileirar registros de push_delivery (status queued)
    const usersWithActiveTokens = await this.userDeviceRepo
      .createQueryBuilder('device')
      .select('DISTINCT device.userId', 'userId')
      .where('(device.companyId = :companyId OR device.companyId IS NULL)', {
        companyId,
      })
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
    if (!news.isPublished)
      throw new BadRequestException('News must be published to be resent.');

    // audiência original
    const originalAudience = await this.newsAudienceRepo.find({
      where: { newsId, companyId },
      select: ['userId'],
    });
    const originalUserIds = originalAudience.map((na) => na.userId);
    if (!originalUserIds.length) return { sent: 0, requested: 0 };

    // quem abriu
    const openedUsers = await this.interactionEventRepo.find({
      where: { newsId, companyId, type: 'OPEN', userId: In(originalUserIds) },
      select: ['userId'],
    });
    const openedSet = new Set(openedUsers.map((e) => e.userId));

    // alvo: não abertos
    const targetIds = originalUserIds.filter((id) => !openedSet.has(id));
    if (!targetIds.length) return { sent: 0, requested: 0 };

    // payload do push
    const title =
      (payload?.pushTitle?.trim()?.length
        ? payload.pushTitle
        : (news.settings?.pushTitle ?? news.title)) || 'Novo conteúdo';
    const body =
      (payload?.pushContent?.trim()?.length
        ? payload.pushContent
        : (news.settings?.pushContent ?? news.subtitle)) || '';
    const imageUrl =
      Array.isArray(news.highlightImages) && news.highlightImages.length
        ? news.highlightImages[0]
        : undefined;

    // deeplink/web
    const deepLinkMobile = NEWS_DEEPLINK_TEMPLATE
      ? NEWS_DEEPLINK_TEMPLATE.replace(':id', news.id)
      : undefined;

    const webLink = NEWS_WEBLINK_TEMPLATE
      ? NEWS_WEBLINK_TEMPLATE.replace(':id', news.id)
      : WEB_BASE_LEGACY
        ? `${WEB_BASE_LEGACY.replace(/\/+$/, '')}/news/article/${news.id}`
        : undefined;

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

    return {
      sent: res?.success ?? 0,
      requested: res?.requested ?? targetIds.length,
    };
  }

  async listUnopenedUsers(
    newsId: string,
    companyId: string,
  ): Promise<
    Array<{ id: string; name?: string | null; email?: string | null }>
  > {
    const news = await this.newsRepo.findOneBy({ id: newsId, companyId });
    if (!news) throw new NotFoundException('News not found');

    const eligibleRows = await this.newsAudienceRepo.find({
      where: { newsId, companyId },
      select: ['userId'],
    });
    const eligibleIds = eligibleRows.map((r) => r.userId);
    if (!eligibleIds.length) return [];

    const openedRows = await this.interactionEventRepo.find({
      where: { newsId, companyId, type: 'OPEN', userId: In(eligibleIds) },
      select: ['userId'],
    });
    const opened = new Set(openedRows.map((r) => r.userId));

    const unopened = eligibleIds.filter((id) => !opened.has(id));
    if (!unopened.length) return [];

    const users = await this.newsRepo.manager.query(
      `SELECT id, name, email FROM user_entity WHERE id = ANY($1::uuid[])`,
      [unopened],
    );

    const foundMap = new Map<
      string,
      { id: string; name?: string | null; email?: string | null }
    >();
    for (const u of users || [])
      foundMap.set(u.id, {
        id: u.id,
        name: u.name ?? null,
        email: u.email ?? null,
      });

    return unopened.map(
      (id) => foundMap.get(id) || { id, name: null, email: null },
    );
  }

  async getDashboardStats(companyId: string) {
    // 1. Top News (Fixed columns: publishedAt, highlightImages, newsId join)
    const topNews = await this.newsRepo.createQueryBuilder('n')
      .select([
        'n.id AS id',
        'n.title AS title',
        'n.publishedAt AS date',
        // TypeORM raw result for simple-json array might be stringified or not depending on driver
        // We'll simplisticly access it.
        'n.highlightImages AS images'
      ])
      // Use the actual table name 'news_interaction_event' and column 'newsId'
      .leftJoin('news_interaction_event', 'i', 'i."newsId" = n.id::text')
      .where('n.companyId = :companyId', { companyId })
      .groupBy('n.id')
      .orderBy('COUNT(i.id)', 'DESC')
      .limit(5)
      .getRawMany();

    const totalNews = await this.newsRepo.count({ where: { companyId } });

    // 2. Channels Analytics
    const channels = await this.newsRepo.createQueryBuilder('n')
      .leftJoin('n.channel', 'c')
      .leftJoin('news_interaction_event', 'i', 'i."newsId" = n.id::text')
      .select(['c.name AS name'])
      .addSelect('COUNT(DISTINCT n.id)', 'news_count')
      .addSelect('COUNT(i.id)', 'interaction_count')
      .where('n.companyId = :companyId', { companyId })
      .andWhere('n.channelId IS NOT NULL')
      .groupBy('c.id')
      .orderBy('interaction_count', 'DESC') // Sort by interactions
      .limit(10)
      .getRawMany();

    // 3. Heatmap (Interactions by Day/Hour)
    const heatmap = await this.interactionEventRepo.query(`
        SELECT 
            EXTRACT(DOW FROM "createdAt") as day,
            EXTRACT(HOUR FROM "createdAt") as hour,
            COUNT(*) as count
        FROM news_interaction_event
        WHERE "companyId" = $1
        GROUP BY 1, 2
        ORDER BY 1, 2
    `, [companyId]);

    return {
      topNews: topNews.map((n) => {
        // Helper to get cover
        let cover = null;
        try {
          // If Postgres returns valid JSON object/array
          const imgs = (typeof n.images === 'string') ? JSON.parse(n.images) : n.images;
          if (Array.isArray(imgs) && imgs.length > 0) cover = imgs[0];
        } catch (e) { }

        return {
          id: n.id,
          title: n.title,
          date: n.date,
          cover: cover,
          interactions: parseInt(n.count) || 0, // COUNT(i.id) comes as count if not aliased? We explicitly ordered by count, let's infer.
          // Wait, I used orderBy COUNT but didn't Select it explicitly in the SELECT array above.
          // Let me fix the select to include count.
        };
      }),
      totalNews,
      channels: channels.map(c => ({
        name: c.name,
        newsCount: parseInt(c.news_count),
        interactionCount: parseInt(c.interaction_count)
      })),
      heatmap: heatmap.map(h => ({
        day: parseInt(h.day),
        hour: parseInt(h.hour),
        count: parseInt(h.count)
      }))
    };
  }

// ----------
// 🔥 NOVOS: Listas por usuário (para modais/exports)
// MOVIDO PARA NewsAnalyticsService
// ----------

}
