// src/v2/news/news.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { NewsEntity } from 'src/news/news.entity';
import { SpaceEntity } from 'src/spaces/space.entity';
import { Channel } from 'src/channels/channel.entity';

import { InteractionsService } from '../interactions/interactions.service';
import { NewsReactionEntity } from '../interactions/entities/news-reaction.entity';
import { NewsCommentEntity } from '../interactions/entities/news-comment.entity';
import { NewsShareEntity } from '../interactions/entities/news-share.entity';
import { NewsAudienceEntity } from '../interactions/entities/news-audience.entity';

import type { ReactionKind } from '@shared/types/v2/interactions';
import { AudienceService } from '../audience/audience.service';
import { SchemaIntrospectorV2 } from '../common/schema-introspector.v2';
import { CommentCounterAdapterV2 } from '../comments/comment-counter.adapter';

type EventMeta = {
  table: string;
  typeCol: string;
  newsRef: string;
  userIdCol: string;
  createdAtCol: string;
} | null;

function toInt(v: any, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function safeJson<T = any>(v: any, fallback: T): T {
  try {
    if (v == null) return fallback;
    if (typeof v === 'object') return v as T;
    return JSON.parse(String(v)) as T;
  } catch {
    return fallback;
  }
}

@Injectable()
export class NewsV2Service {
  constructor(
    @InjectRepository(NewsEntity) private readonly newsRepo: Repository<NewsEntity>,
    @InjectRepository(SpaceEntity) private readonly spaceRepo: Repository<SpaceEntity>,
    @InjectRepository(Channel) private readonly channelRepo: Repository<Channel>,

    @InjectRepository(NewsReactionEntity) private readonly reactionRepo: Repository<NewsReactionEntity>,
    @InjectRepository(NewsCommentEntity) private readonly commentRepo: Repository<NewsCommentEntity>,
    @InjectRepository(NewsShareEntity) private readonly shareRepo: Repository<NewsShareEntity>,
    @InjectRepository(NewsAudienceEntity) private readonly audienceRepo: Repository<NewsAudienceEntity>,

    private readonly interactions: InteractionsService,
    private readonly audience: AudienceService,

    // novos injetáveis para satisfazer DI e habilitar autodetecção compartilhada
    private readonly commentCounter: CommentCounterAdapterV2,
    private readonly schema: SchemaIntrospectorV2,
  ) {}

  private async ensureNews(companyId: string, newsId: string): Promise<any> {
    const n = await this.newsRepo.findOne({ where: { id: newsId } });
    if (!n || (n as any).companyId !== companyId) {
      throw new ForbiddenException('News not accessible for this company');
    }
    return n;
  }

  private async hasTable(table: string): Promise<boolean> {
    return this.schema.hasTable(table);
  }

  private async hasColumn(table: string, column: string): Promise<boolean> {
    return this.schema.hasColumn(table, column);
  }

  private async detectEventMeta(): Promise<EventMeta> {
    const eventMap: any = await this.schema.detectInteractionEvent();
    if (
      eventMap &&
      eventMap.table &&
      eventMap.typeCol &&
      eventMap.newsRef &&
      eventMap.userIdCol &&
      eventMap.createdAtCol
    ) {
      return {
        table: eventMap.table,
        typeCol: eventMap.typeCol,
        newsRef: eventMap.newsRef,
        userIdCol: eventMap.userIdCol,
        createdAtCol: eventMap.createdAtCol,
      };
    }
    return null;
  }

  private async getAudienceSnapshotAtPublish(companyId: string, newsId: string): Promise<number> {
    const hasFrozen = await this.hasColumn('news_entity', 'audienceSnapshotAtPublish');
    if (hasFrozen) {
      const r = await this.newsRepo.query(
        `SELECT COALESCE("audienceSnapshotAtPublish",0)::int AS v FROM news_entity WHERE id=$1 AND "companyId"=$2 LIMIT 1`,
        [newsId, companyId],
      );
      if (r && r[0]) return toInt(r[0].v);
    }
    const hasAudience = await this.hasTable('news_audience');
    if (!hasAudience) return 0;
    const r2 = await this.newsRepo.query(
      `SELECT COUNT(*)::int AS c FROM news_audience WHERE "companyId"=$1 AND "newsId"=$2`,
      [companyId, newsId],
    );
    return (r2 && r2[0]) ? toInt(r2[0].c) : 0;
  }

  async detail(companyId: string, id: string, userId: string) {
    const n = await this.ensureNews(companyId, id);

    let spaceName: string | null = null;
    let channelName: string | null = null;
    if ((n as any).spaceId) {
      const s = await this.spaceRepo.find({ where: { id: In([(n as any).spaceId]) } });
      if (s && s[0]) spaceName = (s[0] as any).name ?? (s[0] as any).title ?? null;
    }
    if ((n as any).channelId) {
      const c = await this.channelRepo.find({ where: { id: In([(n as any).channelId]) } });
      if (c && c[0]) channelName = (c[0] as any).name ?? (c[0] as any).title ?? null;
    }

    const meta = await this.detectEventMeta();

    let opened = false;
    let acknowledged = false;
    let readAt: string | null = null;
    if (meta) {
      const { table, typeCol, newsRef, userIdCol, createdAtCol } = meta;
      const rows = await this.newsRepo.query(
        `SELECT MAX("${createdAtCol}") AS ra,
                BOOL_OR((${typeCol} IN ('ACK','ack'))) AS has_ack,
                BOOL_OR((${typeCol} IN ('OPEN','open'))) AS has_open
         FROM ${table}
         WHERE "companyId"=$1 AND "${userIdCol}"=$2 AND "${newsRef}"=$3
           AND (${typeCol} IN ('OPEN','open','ACK','ack'))`,
        [companyId, userId, id],
      );
      if (rows && rows[0]) {
        opened = !!(rows[0].has_open || rows[0].has_ack);
        acknowledged = !!rows[0].has_ack;
        readAt = rows[0].ra ? new Date(rows[0].ra).toISOString() : null;
      }
    }

    let myReaction: ReactionKind | null = null;
    {
      const r = await this.reactionRepo.query(
        `SELECT reaction FROM news_reaction WHERE "companyId"=$1 AND "userId"=$2 AND "newsId"=$3 LIMIT 1`,
        [companyId, userId, id],
      );
      if (r && r[0]) myReaction = String(r[0].reaction) as ReactionKind;
    }

    const myComments = await (async () => {
      // usa adapter de comentários com autodetecção interna
      return await this.commentCounter.countApprovedByUserForNews(companyId, userId, id);
    })();

    const audienceSnapshotAtPublish = await this.getAudienceSnapshotAtPublish(companyId, id);

    let uniqueOpens = 0;
    let acks = 0;
    if (meta) {
      const { table, typeCol, newsRef, userIdCol } = meta;

      const u = await this.newsRepo.query(
        `SELECT COUNT(DISTINCT "${userIdCol}")::int AS c
         FROM ${table}
         WHERE "companyId"=$1 AND ${typeCol} IN ('OPEN','open') AND "${newsRef}"=$2`,
        [companyId, id],
      );
      uniqueOpens = (u && u[0]) ? toInt(u[0].c) : 0;

      const ak = await this.newsRepo.query(
        `SELECT COUNT(DISTINCT "${userIdCol}")::int AS c
         FROM ${table}
         WHERE "companyId"=$1 AND ${typeCol} IN ('ACK','ack') AND "${newsRef}"=$2`,
        [companyId, id],
      );
      acks = (ak && ak[0]) ? toInt(ak[0].c) : 0;
    }

    const reactionsTotal = await (async () => {
      const r = await this.reactionRepo.query(
        `SELECT COUNT(*)::int AS c FROM news_reaction WHERE "companyId"=$1 AND "newsId"=$2`,
        [companyId, id],
      );
      return (r && r[0]) ? toInt(r[0].c) : 0;
    })();

    const reactionsByType = await (async () => {
      const r = await this.reactionRepo.query(
        `SELECT reaction, COUNT(*)::int AS c
         FROM news_reaction
         WHERE "companyId"=$1 AND "newsId"=$2
         GROUP BY reaction`,
        [companyId, id],
      );
      const out: Record<string, number> = {};
      for (const row of r || []) {
        out[String(row.reaction)] = toInt(row.c);
      }
      return out;
    })();

    const commentsTotal = await this.commentCounter.countApprovedForNews(companyId, id);

    const sharesTotal = await (async () => {
      const r = await this.shareRepo.query(
        `SELECT COUNT(*)::int AS c
         FROM news_share
         WHERE "companyId"=$1 AND "newsId"=$2`,
        [companyId, id],
      );
      return (r && r[0]) ? toInt(r[0].c) : 0;
    })();

    const settingsRaw = safeJson<any>((n as any).settings, {});
    const settings = {
      acknowledgementRequired:
        (settingsRaw?.acknowledgementRequired ?? settingsRaw?.ackRequired ?? false) === true,
      allowReactions: (settingsRaw?.allowReactions ?? true) === true,
      allowComments: (settingsRaw?.allowComments ?? false) === true,
      commentsRequireModeration:
        (settingsRaw?.commentsRequireModeration ?? settingsRaw?.moderateComments ?? false) === true,
      shareEnabled: (settingsRaw?.shareEnabled ?? true) === true,
    };

    return {
      id: String((n as any).id),
      companyId: String((n as any).companyId),
      createdAt: (n as any).createdAt,
      updatedAt: (n as any).updatedAt ?? null,
      title: (n as any).title,
      subtitle: (n as any).subtitle ?? null,
      contentHtml: (n as any).contentHtml ?? null,
      excerpt: (n as any).excerpt ?? null,
      highlightImages: safeJson<string[]>((n as any).highlightImages, []),
      attachments: safeJson<any[]>((n as any).attachments, []),

      spaceId: (n as any).spaceId ?? null,
      spaceName,
      channelId: (n as any).channelId ?? null,
      channelName,

      settings,

      metrics: {
        audienceSnapshotAtPublish,
        uniqueOpens,
        acks,
        reactionsTotal,
        reactionsByType,
        commentsTotal,
        sharesTotal,
      },

      userState: {
        opened,
        readAt,
        acknowledged,
        myReaction,
        myComments,
      },
    };
  }

  async open(companyId: string, newsId: string, userId: string, _meta?: Record<string, any>) {
    await this.ensureNews(companyId, newsId);
    return this.interactions.markOpen(companyId, newsId, userId);
  }

  async ack(companyId: string, newsId: string, userId: string) {
    await this.ensureNews(companyId, newsId);
    return this.interactions.acknowledge(companyId, newsId, userId);
  }

  async react(companyId: string, newsId: string, userId: string, reaction: ReactionKind) {
    await this.ensureNews(companyId, newsId);
    return this.interactions.react(companyId, newsId, userId, reaction);
  }

  async comment(companyId: string, newsId: string, userId: string, text: string) {
    const n = await this.ensureNews(companyId, newsId);
    const settings: any = (n as any).settings ?? {};
    const moderateComments =
      (settings?.commentsRequireModeration ?? settings?.moderation?.comments ?? settings?.moderateComments ?? false) === true;
    return this.interactions.comment(companyId, newsId, userId, text, moderateComments);
  }

  async share(
    companyId: string,
    newsId: string,
    userId: string,
    channel: 'app' | 'email' | 'whatsapp' | 'telegram' | undefined,
    meta?: Record<string, any>,
  ) {
    await this.ensureNews(companyId, newsId);
    const mapped: 'app' | 'external' = channel === 'app' ? 'app' : 'external';
    return this.interactions.share(companyId, newsId, userId, mapped, meta);
  }

  async snapshotAudience(companyId: string, newsId: string, opts?: { companyWide?: boolean }) {
    await this.ensureNews(companyId, newsId);

    const userIds: string[] = opts?.companyWide
      ? await this.audience.resolveForScope(companyId, {})
      : await this.audience.resolveForNews(companyId, newsId);

    if (!userIds || userIds.length === 0) {
      if (await this.hasColumn('news_entity', 'audienceSnapshotAtPublish')) {
        await this.newsRepo.query(
          `UPDATE news_entity SET "audienceSnapshotAtPublish"=$1 WHERE id=$2 AND "companyId"=$3`,
          [0, newsId, companyId],
        );
      }
      if (await this.hasTable('news_audience')) {
        await this.newsRepo.query(
          `DELETE FROM news_audience WHERE "companyId"=$1 AND "newsId"=$2`,
          [companyId, newsId],
        );
      }
      return { inserted: 0, audienceSnapshotAtPublish: 0 };
    }

    if (!(await this.hasTable('news_audience'))) {
      return { inserted: 0, audienceSnapshotAtPublish: userIds.length };
    }

    const CHUNK = 1000;
    let inserted = 0;
    for (let i = 0; i < userIds.length; i += CHUNK) {
      const part = userIds.slice(i, i + CHUNK);
      const valuesSql = part.map((_, idx) => `($1,$2,$${idx + 3})`).join(',');
      const params = [companyId, newsId, ...part];
      await this.newsRepo.query(
        `INSERT INTO news_audience ("companyId","newsId","userId")
         VALUES ${valuesSql}
         ON CONFLICT ("companyId","newsId","userId") DO NOTHING`,
        params,
      );
      inserted += part.length;
    }

    if (await this.hasColumn('news_entity', 'audienceSnapshotAtPublish')) {
      await this.newsRepo.query(
        `UPDATE news_entity SET "audienceSnapshotAtPublish"=$1 WHERE id=$2 AND "companyId"=$3`,
        [userIds.length, newsId, companyId],
      );
    }

    return { inserted, audienceSnapshotAtPublish: userIds.length };
  }
}