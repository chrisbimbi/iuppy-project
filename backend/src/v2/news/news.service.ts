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

/** State calculado por usuário para uma News */
export interface UserState {
  opened: boolean;
  openedAt: string | null;
  readAt: string | null;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  myReaction: ReactionKind | null;
  myComments: number;
}

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

function sanitizeAvatar(url: string | null): string | null {
  if (url == null) return null;
  const s = String(url).trim();
  if (!s) return null;
  const lo = s.toLowerCase();

  // descartar placeholders/comuns não-URL
  if (lo === 'false' || lo === 'true' || lo === 'null' || lo === 'none') return null;

  // apenas http/https/data:image
  const isHttp = lo.startsWith('http://') || lo.startsWith('https://');
  const isData = lo.startsWith('data:image');
  if (!(isHttp || isData)) return null;

  if (isHttp) {
    try {
      const u = new URL(s);
      const host = u.hostname.toLowerCase();
      // bloquear hosts que 403 sem assinatura/cookie (evita “avatar 403”)
      if (host.includes('instagram') || host.endsWith('fbcdn.net')) return null;
    } catch {
      return null;
    }
  }

  return s;
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
    private readonly commentCounter: CommentCounterAdapterV2,
    private readonly schema: SchemaIntrospectorV2,
  ) {}

  // ---------- infra / helpers

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

  /**
   * Detecção robusta do metadado do evento:
   * 1) Usa o introspector se disponível.
   * 2) Se vier vazio, tenta fallback estático para news_interaction_event.
   */
  private async detectEventMeta(): Promise<EventMeta> {
    try {
      const fromIntrospector: any = await (this.schema as any)?.detectInteractionEvent?.();
      if (
        fromIntrospector &&
        fromIntrospector.table &&
        fromIntrospector.typeCol &&
        fromIntrospector.newsRef &&
        fromIntrospector.userIdCol &&
        fromIntrospector.createdAtCol
      ) {
        return {
          table: fromIntrospector.table,
          typeCol: fromIntrospector.typeCol,
          newsRef: fromIntrospector.newsRef,
          userIdCol: fromIntrospector.userIdCol,
          createdAtCol: fromIntrospector.createdAtCol,
        };
      }
    } catch {
      // ignora, vamos tentar fallback
    }

    // Fallback “hardcoded” — é o que seus logs mostram existir
    const table = 'news_interaction_event';
    const okTable = await this.hasTable(table);
    if (!okTable) return null;

    const needed = ['type', 'newsId', 'userId', 'createdAt'] as const;
    for (const col of needed) {
      const ok = await this.hasColumn(table, col);
      if (!ok) return null;
    }

    return {
      table,
      typeCol: 'type',
      newsRef: 'newsId',
      userIdCol: 'userId',
      createdAtCol: 'createdAt',
    };
  }

  private async getAudienceSnapshotAtPublish(companyId: string, newsId: string): Promise<number> {
    const hasFrozen = await this.hasColumn('news_entity', 'audienceSnapshotAtPublish');
    if (hasFrozen) {
      const r = await this.newsRepo.query(
        `SELECT COALESCE("audienceSnapshotAtPublish",0)::int AS v
           FROM news_entity
          WHERE id=$1 AND "companyId"=$2
          LIMIT 1`,
        [newsId, companyId],
      );
      if (r && r[0]) return toInt(r[0].v);
    }
    const hasAudience = await this.hasTable('news_audience');
    if (!hasAudience) return 0;
    const r2 = await this.newsRepo.query(
      `SELECT COUNT(*)::int AS c
         FROM news_audience
        WHERE "companyId"=$1 AND "newsId"=$2`,
      [companyId, newsId],
    );
    return (r2 && r2[0]) ? toInt(r2[0].c) : 0;
  }

  private async fetchAuthor(companyId: string, authorId?: string | null): Promise<{ name: string | null; avatar: string | null }> {
    if (!authorId) return { name: null, avatar: null };
    const rows = await this.newsRepo.query(
      `SELECT COALESCE(NULLIF(u."displayName", ''), NULLIF(u."name", '')) AS name,
              NULLIF(u."avatarUrl",'') AS avatar
         FROM user_entity u
        WHERE u."companyId" = $1 AND u."id"::text = $2
        LIMIT 1`,
      [companyId, String(authorId)],
    );
    if (rows && rows[0]) {
      return { name: rows[0].name ?? null, avatar: sanitizeAvatar(rows[0].avatar ?? null) };
    }
    return { name: null, avatar: null };
  }

  private async fetchPreviewComments(companyId: string, newsId: string, limit = 6) {
    const rows = await this.newsRepo.query(
      `
      SELECT
        COALESCE(NULLIF(u."avatarUrl", ''), NULL) AS avatar,
        COALESCE(NULLIF(u."displayName", ''), NULLIF(u."name", '')) AS name,
        c."text" AS text
      FROM news_comment c
      JOIN user_entity u ON u.id::text = c."userId"::text
      WHERE c."companyId"=$1 AND c."newsId"=$2 AND c."approved" = TRUE
      ORDER BY c."createdAt" DESC
      LIMIT $3
      `,
      [companyId, newsId, limit],
    );
    return (rows ?? []).map((r: any) => ({
      avatar: sanitizeAvatar(r.avatar ?? null),
      name: r.name ?? null,
      text: String(r.text ?? ''),
    }));
  }

  private async fetchReactorsPreview(companyId: string, newsId: string, limit = 3) {
    const rows = await this.newsRepo.query(
      `
      SELECT DISTINCT ON (r."userId")
        r."userId"::text AS "userId",
        COALESCE(NULLIF(u."avatarUrl", ''), NULL) AS avatar,
        COALESCE(NULLIF(u."displayName", ''), NULLIF(u."name", '')) AS name
      FROM news_reaction r
      JOIN user_entity u ON u.id::text = r."userId"::text
      WHERE r."companyId"=$1 AND r."newsId"=$2
      ORDER BY r."userId", r."createdAt" DESC
      LIMIT $3
      `,
      [companyId, newsId, limit],
    );
    return (rows ?? []).map((r: any) => ({
      userId: String(r.userId),
      avatar: sanitizeAvatar(r.avatar ?? null),
      name: r.name ?? null,
    }));
  }

  private async fetchCommentersPreview(companyId: string, newsId: string, limit = 3) {
    const rows = await this.newsRepo.query(
      `
      SELECT DISTINCT ON (c."userId")
        c."userId"::text AS "userId",
        COALESCE(NULLIF(u."avatarUrl", ''), NULL) AS avatar,
        COALESCE(NULLIF(u."displayName", ''), NULLIF(u."name", '')) AS name
      FROM news_comment c
      JOIN user_entity u ON u.id::text = c."userId"::text
      WHERE c."companyId"=$1 AND c."newsId"=$2 AND c."approved" = TRUE
      ORDER BY c."userId", c."createdAt" DESC
      LIMIT $3
      `,
      [companyId, newsId, limit],
    );
    return (rows ?? []).map((r: any) => ({
      userId: String(r.userId),
      avatar: sanitizeAvatar(r.avatar ?? null),
      name: r.name ?? null,
    }));
  }

  private async fetchSharersPreview(companyId: string, newsId: string, limit = 3) {
    const rows = await this.newsRepo.query(
      `
      SELECT DISTINCT ON (s."userId")
        s."userId"::text AS "userId",
        COALESCE(NULLIF(u."avatarUrl", ''), NULL) AS avatar,
        COALESCE(NULLIF(u."displayName", ''), NULLIF(u."name", '')) AS name
      FROM news_share s
      JOIN user_entity u ON u.id::text = s."userId"::text
      WHERE s."companyId"=$1 AND s."newsId"=$2
      ORDER BY s."userId", s."createdAt" DESC
      LIMIT $3
      `,
      [companyId, newsId, limit],
    );
    return (rows ?? []).map((r: any) => ({
      userId: String(r.userId),
      avatar: sanitizeAvatar(r.avatar ?? null),
      name: r.name ?? null,
    }));
  }

  // ---------- user state (OPEN / ACK)

  public async getUserState(companyId: string, id: string, userId: string): Promise<UserState> {
    const meta = await this.detectEventMeta();

    let opened = false;
    let acknowledged = false;
    let readAt: string | null = null;
    let openedAt: string | null = null;
    let acknowledgedAt: string | null = null;

    if (meta) {
      const { table, typeCol, newsRef, userIdCol, createdAtCol } = meta;
      const rows = await this.newsRepo.query(
        `SELECT
           MAX(CASE WHEN UPPER("${typeCol}"::text)='ACK'  THEN "${createdAtCol}" END) AS ack_at,
           MAX(CASE WHEN UPPER("${typeCol}"::text)='OPEN' THEN "${createdAtCol}" END) AS open_at
         FROM ${table}
        WHERE "companyId"=$1 AND "${userIdCol}"=$2 AND "${newsRef}"=$3
          AND UPPER("${typeCol}"::text) IN ('OPEN','ACK')`,
        [companyId, userId, id],
      );
      if (rows && rows[0]) {
        acknowledgedAt = rows[0].ack_at ? new Date(rows[0].ack_at).toISOString() : null;
        openedAt = rows[0].open_at ? new Date(rows[0].open_at).toISOString() : null;

        acknowledged = !!acknowledgedAt;
        opened = !!(openedAt || acknowledgedAt);
        const last = [acknowledgedAt, openedAt].filter(Boolean).sort(); // ISO asc
        readAt = last.length ? (last[last.length - 1] as string) : null;
      }
    }

    // myReaction
    let myReaction: ReactionKind | null = null;
    {
      const r = await this.reactionRepo.query(
        `SELECT reaction
           FROM news_reaction
          WHERE "companyId"=$1 AND "userId"=$2 AND "newsId"=$3
          LIMIT 1`,
        [companyId, userId, id],
      );
      if (r && r[0]) myReaction = String(r[0].reaction) as ReactionKind;
    }

    const myComments = await this.commentCounter.countApprovedByUserForNews(companyId, userId, id);

    return {
      opened,
      openedAt,
      readAt,
      acknowledged,
      acknowledgedAt,
      myReaction,
      myComments,
    };
  }

  // ---------- detail

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

    const userState = await this.getUserState(companyId, id, userId);

    const audienceSnapshotAtPublish = await this.getAudienceSnapshotAtPublish(companyId, id);

    // métricas agregadas
    const meta = await this.detectEventMeta();

    let uniqueOpens = 0;
    let totalOpens = 0;
    let acks = 0;

    if (meta) {
      const { table, typeCol, newsRef, userIdCol } = meta;

      // TOTAL opens
      {
        const r = await this.newsRepo.query(
          `SELECT COUNT(*)::int AS c
             FROM ${table}
            WHERE "companyId"=$1 AND "${newsRef}"=$2
              AND UPPER("${typeCol}"::text) = 'OPEN'`,
          [companyId, id],
        );
        totalOpens = (r && r[0]) ? toInt(r[0].c) : 0;
      }

      // UNIQUE opens
      {
        const r = await this.newsRepo.query(
          `SELECT COUNT(DISTINCT "${userIdCol}")::int AS c
             FROM ${table}
            WHERE "companyId"=$1 AND "${newsRef}"=$2
              AND UPPER("${typeCol}"::text) = 'OPEN'`,
          [companyId, id],
        );
        uniqueOpens = (r && r[0]) ? toInt(r[0].c) : 0;
      }

      // ACKs (usuários distintos)
      {
        const r = await this.newsRepo.query(
          `SELECT COUNT(DISTINCT "${userIdCol}")::int AS c
             FROM ${table}
            WHERE "companyId"=$1 AND "${newsRef}"=$2
              AND UPPER("${typeCol}"::text) = 'ACK'`,
          [companyId, id],
        );
        acks = (r && r[0]) ? toInt(r[0].c) : 0;
      }
    }

    const reactionsTotal = await (async () => {
      const r = await this.reactionRepo.query(
        `SELECT COUNT(*)::int AS c
           FROM news_reaction
          WHERE "companyId"=$1 AND "newsId"=$2`,
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

    const { name: authorName, avatar: authorAvatarUrl } = await this.fetchAuthor(
      companyId,
      (n as any).authorId ?? null,
    );

    const previewComments = await this.fetchPreviewComments(companyId, id, 6);
    const reactorsPreview = await this.fetchReactorsPreview(companyId, id, 3);
    const commentersPreview = await this.fetchCommentersPreview(companyId, id, 3);
    const sharersPreview = await this.fetchSharersPreview(companyId, id, 3);

    const metrics = {
      audienceSnapshotAtPublish,

      // compat
      totalOpens,
      uniqueOpens,
      acknowledgements: acks,
      reactions: reactionsByType,
      comments: commentsTotal,
      shares: sharesTotal,

      // novos
      acks,
      reactionsTotal,
      reactionsByType,
      commentsTotal,
      sharesTotal,
    };

    return {
      id: String((n as any).id),
      companyId: String((n as any).companyId),
      createdAt: (n as any).createdAt,
      updatedAt: (n as any).updatedAt ?? null,

      title: (n as any).title,
      subtitle: (n as any).subtitle ?? null,
      contentHtml: (n as any).contentHtml ?? (n as any).content ?? null,
      excerpt: (n as any).excerpt ?? null,
      highlightImages: safeJson<string[]>((n as any).highlightImages, []),
      attachments: safeJson<any[]>((n as any).attachments, []),

      authorId: (n as any).authorId ?? null,
      authorName,
      authorAvatarUrl,

      spaceId: (n as any).spaceId ?? null,
      spaceName,
      channelId: (n as any).channelId ?? null,
      channelName,

      settings,

      previewComments,
      reactorsPreview,
      commentersPreview,
      sharersPreview,

      metrics,

      userState,

      serverTime: new Date().toISOString(),
    };
  }

  // ---------- interactions

  async open(companyId: string, newsId: string, userId: string, _meta?: Record<string, any>): Promise<{ userState: UserState }> {
    await this.ensureNews(companyId, newsId);
    await this.interactions.markOpen(companyId, newsId, userId);
    // recalc imediata garante retorno consistente
    const userState = await this.getUserState(companyId, newsId, userId);
    return { userState };
  }

  async ack(companyId: string, newsId: string, userId: string): Promise<{ userState: UserState }> {
    await this.ensureNews(companyId, newsId);
    await this.interactions.acknowledge(companyId, newsId, userId);
    // recalc imediata garante retorno consistente
    const userState = await this.getUserState(companyId, newsId, userId);
    return { userState };
  }

  async react(companyId: string, newsId: string, userId: string, reaction: ReactionKind) {
    await this.ensureNews(companyId, newsId);
    return this.interactions.react(companyId, newsId, userId, reaction);
  }

  async unreact(companyId: string, newsId: string, userId: string) {
    await this.ensureNews(companyId, newsId);
    await this.reactionRepo.query(
      `DELETE FROM news_reaction
        WHERE "companyId"=$1 AND "newsId"=$2 AND "userId"=$3`,
      [companyId, newsId, userId],
    );
    return { ok: true };
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

  // ---------- comments list (bottomsheet)

  async listComments(
    companyId: string,
    newsId: string,
    opts: { limit: number; cursor?: string },
  ) {
    await this.ensureNews(companyId, newsId);
    const { limit, cursor } = opts;

    const params: any[] = [companyId, newsId];
    let cursorSql = '';
    if (cursor) {
      cursorSql = `AND c."createdAt" < $3`;
      params.push(new Date(cursor));
    }

    const rows = await this.newsRepo.query(
      `
      SELECT
        c."id"::text AS "id",
        c."text" AS "text",
        c."createdAt" AS "createdAt",
        u."id"::text AS "userId",
        COALESCE(NULLIF(u."displayName", ''), NULLIF(u."name", '')) AS "name",
        COALESCE(NULLIF(u."avatarUrl", ''), NULL) AS "avatar"
      FROM news_comment c
      JOIN user_entity u ON u.id::text = c."userId"::text
      WHERE c."companyId"=$1 AND c."newsId"=$2 AND c."approved" = TRUE
      ${cursorSql}
      ORDER BY c."createdAt" DESC
      LIMIT ${Math.max(1, Math.min(200, limit))}
      `,
      params,
    );

    const items = (rows ?? []).map((r: any) => ({
      id: String(r.id),
      text: String(r.text ?? ''),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
      user: {
        id: String(r.userId),
        name: r.name ?? null,
        avatar: sanitizeAvatar(r.avatar ?? null),
      },
    }));

    const nextCursor =
      items.length > 0 ? items[items.length - 1].createdAt : null;

    return { items, nextCursor };
  }

  // ---------- audience snapshot

  async snapshotAudience(companyId: string, newsId: string, opts?: { companyWide?: boolean }) {
    await this.ensureNews(companyId, newsId);

    const userIds: string[] = opts?.companyWide
      ? await this.audience.resolveForScope(companyId, {})
      : await this.audience.resolveForNews(companyId, newsId);

    if (!userIds || userIds.length === 0) {
      if (await this.hasColumn('news_entity', 'audienceSnapshotAtPublish')) {
        await this.newsRepo.query(
          `UPDATE news_entity
              SET "audienceSnapshotAtPublish"=$1
            WHERE id=$2 AND "companyId"=$3`,
          [0, newsId, companyId],
        );
      }
      if (await this.hasTable('news_audience')) {
        await this.newsRepo.query(
          `DELETE FROM news_audience
            WHERE "companyId"=$1 AND "newsId"=$2`,
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
        `UPDATE news_entity
            SET "audienceSnapshotAtPublish"=$1
          WHERE id=$2 AND "companyId"=$3`,
        [userIds.length, newsId, companyId],
      );
    }

    return { inserted, audienceSnapshotAtPublish: userIds.length };
  }
}