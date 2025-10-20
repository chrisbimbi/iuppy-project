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

/** ✅ Templates preferenciais via .env; com fallback explícito para DEV */
const NEWS_DEEPLINK_TEMPLATE =
  process.env.APP_NEWS_DEEPLINK_TEMPLATE ||
  'iuppydev://news/article/:id'; // fallback dev sempre válido
const NEWS_WEBLINK_TEMPLATE = process.env.APP_NEWS_WEBLINK_TEMPLATE || '';
const WEB_BASE_LEGACY = process.env.NEWS_WEB_BASE_URL || process.env.WEBAPP_URL || '';

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

  async create(dto: CreateNewDto): Promise<News> {
    const entity = this.newsRepo.create({
      ...dto,
      attachments: dto.attachments?.map((a) => a.url) ?? [],
      highlightImages: dto.highlightImages?.map((i) => i.url) ?? [],
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
      toUpdate.attachments = dto.attachments.map((a) => a.url);
    }
    if (dto.highlightImages) {
      toUpdate.highlightImages = dto.highlightImages.map((i) => i.url);
    }
    await this.newsRepo.update(id, toUpdate);
    return this.findOne(id) as Promise<News>;
  }

  async remove(id: string): Promise<void> {
    await this.newsRepo.delete(id);
  }

  async publish(newsId: string, companyId: string): Promise<News> {
    const news = await this.newsRepo.findOneBy({ id: newsId, companyId });
    if (!news) {
      throw new NotFoundException(`News with ID ${newsId} not found.`);
    }

    if (news.isPublished) {
      throw new Error('News is already published.');
    }

    const { audienceMode, audienceSpaceId, audienceChannelIds, audienceGroupIds } = news.settings || {};
    if (!audienceMode) {
      throw new Error('Audience mode not set for this news.');
    }

    const params: Record<string, any> = {};
    if (audienceSpaceId) params.spaceId = audienceSpaceId;
    if (audienceChannelIds) params.channelIds = audienceChannelIds;
    if (audienceGroupIds) params.groupIds = audienceGroupIds;

    // 1) Probe e snapshot
    const audienceProbeResult = await this.audienceResolverService.probe(companyId, audienceMode as AudienceMode, params);

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
          // ignora duplicadas
        }
      }
    });

    // 3) Enfileira push_delivery (status queued); envio real por worker
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

  /**
   * Reenvia push para quem **não abriu** ainda.
   * Aceita overrides de título/conteúdo via body (opcional).
   */
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

    // payload do push (override > settings > título/subtítulo)
    const title =
      (payload?.pushTitle?.trim()?.length ? payload.pushTitle : news.settings?.pushTitle ?? news.title) || 'Novo conteúdo';
    const body =
      (payload?.pushContent?.trim()?.length ? payload.pushContent : news.settings?.pushContent ?? news.subtitle) || '';
    const imageUrl = Array.isArray(news.highlightImages) && news.highlightImages.length ? news.highlightImages[0] : undefined;

    // ✅ deeplink/app & web por TEMPLATE (com fallback dev e legado)
    const deepLinkMobile = (NEWS_DEEPLINK_TEMPLATE || 'iuppydev://news/article/:id').replace(':id', news.id);

    const webLink =
      (NEWS_WEBLINK_TEMPLATE ? NEWS_WEBLINK_TEMPLATE.replace(':id', news.id) : undefined) ||
      (WEB_BASE_LEGACY ? `${WEB_BASE_LEGACY.replace(/\/+$/, '')}/news/article/${news.id}` : undefined);

    // envia via FCM (registrará push_delivery dinamicamente)
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

  /**
   * Lista de usuários elegíveis que **não abriram** (para export/CSV).
   * Retorna id, name, email quando disponíveis.
   */
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
    const eligibleIds = eligibleRows.map((r) => r.userId);
    if (!eligibleIds.length) return [];

    const openedRows = await this.interactionEventRepo.find({
      where: { newsId, companyId, type: 'OPEN', userId: In(eligibleIds) },
      select: ['userId'],
    });
    const opened = new Set(openedRows.map((r) => r.userId));

    const unopened = eligibleIds.filter((id) => !opened.has(id));
    if (!unopened.length) return [];

    // buscar dados básicos do usuário
    const users = await this.newsRepo.manager.query(
      `SELECT id, name, email FROM user_entity WHERE id = ANY($1::uuid[])`,
      [unopened],
    );

    const foundMap = new Map<string, { id: string; name?: string | null; email?: string | null }>();
    for (const u of users || []) {
      foundMap.set(u.id, { id: u.id, name: u.name ?? null, email: u.email ?? null });
    }

    return unopened.map((id) => foundMap.get(id) || { id, name: null, email: null });
  }
}