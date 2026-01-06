import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import type {
  MeFeedQuery,
  MeFeedResponseDTO,
  MeFeedItemDTO,
  ReactionKind,
} from 'src/v2/me/dto/me-feed.dto';

import { NewsEntity } from 'src/news/news.entity';
import { SpaceEntity } from 'src/spaces/space.entity';
import { Channel } from 'src/channels/channel.entity';

import { NewsAudienceEntity } from 'src/v2/interactions/entities/news-audience.entity';
import { NewsReactionEntity } from 'src/v2/interactions/entities/news-reaction.entity';
import { NewsCommentEntity } from 'src/v2/interactions/entities/news-comment.entity';
import { NewsShareEntity } from 'src/v2/interactions/entities/news-share.entity';

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

function stripHtml(html?: string | null): string {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildExcerpt(n: any): string | undefined {
  const excerpt =
    n.excerpt ??
    (n.contentHtml ? stripHtml(n.contentHtml).slice(0, 200) : undefined) ??
    (n.subtitle ? String(n.subtitle).slice(0, 200) : undefined);
  return excerpt || undefined;
}

function parseCursor(
  c?: string | null,
): { createdAt: string; id: string } | null {
  if (!c) return null;
  const [ts, id] = String(c).split('|');
  if (!ts || !id) return null;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return null;
  return { createdAt: new Date(ts).toISOString(), id };
}

@Injectable()
export class FeedV2Service {
  constructor(
    @InjectRepository(NewsEntity)
    private readonly newsRepo: Repository<NewsEntity>,
    @InjectRepository(SpaceEntity)
    private readonly spaceRepo: Repository<SpaceEntity>,
    @InjectRepository(Channel)
    private readonly channelRepo: Repository<Channel>,

    @InjectRepository(NewsAudienceEntity)
    private readonly audienceRepo: Repository<NewsAudienceEntity>,
    @InjectRepository(NewsReactionEntity)
    private readonly reactionRepo: Repository<NewsReactionEntity>,
    @InjectRepository(NewsCommentEntity)
    private readonly commentRepo: Repository<NewsCommentEntity>,
    @InjectRepository(NewsShareEntity)
    private readonly shareRepo: Repository<NewsShareEntity>,
  ) {}

  // ---------- infra helpers

  private async hasTable(table: string): Promise<boolean> {
    const r = await this.newsRepo.query(`SELECT to_regclass($1) AS t`, [
      `public.${table}`,
    ]);
    return !!(r && r[0] && r[0].t);
  }

  private async detectEventMeta(): Promise<EventMeta> {
    const r = await this.newsRepo.query(
      `SELECT to_regclass('public.news_interaction_event') AS nie, to_regclass('public.interaction_event') AS ie`,
    );
    const table =
      (r && r[0] && r[0].nie && 'news_interaction_event') ||
      (r && r[0] && r[0].ie && 'interaction_event') ||
      null;

    if (!table) return null;

    const cols = await this.newsRepo.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
      [table],
    );
    const names: string[] = (cols || []).map((c: any) => c.column_name);
    const typeCol = names.includes('type')
      ? 'type'
      : names.includes('event')
        ? 'event'
        : null;
    const newsRef = names.includes('newsId')
      ? 'newsId'
      : names.includes('objectId')
        ? 'objectId'
        : null;
    const userIdCol = names.includes('userId') ? 'userId' : null;
    const createdAtCol = names.includes('createdAt') ? 'createdAt' : null;

    if (!typeCol || !newsRef || !userIdCol || !createdAtCol) return null;
    return { table, typeCol, newsRef, userIdCol, createdAtCol };
  }

  // ---------- public API

  async getFeed(
    companyId: string,
    userId: string,
    query: MeFeedQuery,
  ): Promise<MeFeedResponseDTO> {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
    const cursor = parseCursor(query.cursor);
    const spaceId = query.spaceId || undefined;
    const channelId = query.channelId || undefined;

    const serverTime = new Date().toISOString();

    // 0) precisa existir news_audience para garantir segmentação correta
    const hasAudience = await this.hasTable('news_audience');
    if (!hasAudience) {
      return {
        items: [],
        counters: { totalUnread: 0, bySpace: {}, byChannel: {} },
        nextCursor: null,
        etag: serverTime,
        serverTime,
      };
    }

    // 1) Base de visibilidade: news_audience (aplica segmentação)
    const baseParams: any[] = [companyId, userId];
    let sqlBase = `SELECT n.id, n."createdAt", n."updatedAt",
              n.title, n.subtitle, n."contentHtml", n.excerpt,
              n."highlightImages", n.attachments,
              n."spaceId", n."channelId",
              n."settings"
       FROM news_entity n
       INNER JOIN news_audience a
           ON a."newsId" = n.id AND a."companyId" = n."companyId" AND a."userId" = $2
       WHERE n."companyId"=$1 AND n.status='published'`;

    let idx = 3;
    if (spaceId) {
      sqlBase += ` AND n."spaceId" = $${idx}`;
      baseParams.push(spaceId);
      idx++;
    }
    if (channelId) {
      sqlBase += ` AND n."channelId" = $${idx}`;
      baseParams.push(channelId);
      idx++;
    }
    if (cursor) {
      sqlBase += ` AND (n."createdAt" < $${idx} OR (n."createdAt" = $${idx} AND n.id < $${idx + 1}))`;
      baseParams.push(cursor.createdAt, cursor.id);
      idx += 2;
    }
    sqlBase += ` ORDER BY n."createdAt" DESC, n.id DESC LIMIT ${limit + 1}`;

    const rows = await this.newsRepo.query(sqlBase, baseParams);
    const slice = rows.slice(0, limit);
    const more = rows.length > limit;
    const nextCursor = more
      ? `${new Date(rows[limit].createdAt).toISOString()}|${rows[limit].id}`
      : null;

    const newsIds: string[] = slice.map((r: any) => r.id);
    const uniqueSpaceIds = Array.from(
      new Set(slice.map((r: any) => r.spaceId).filter(Boolean)),
    );
    const uniqueChannelIds = Array.from(
      new Set(slice.map((r: any) => r.channelId).filter(Boolean)),
    );

    // 2) nomes de space/channel (lookup em lote) — evitar union types
    let spaces: SpaceEntity[] = [];
    let channels: Channel[] = [];
    if (uniqueSpaceIds.length) {
      spaces = await this.spaceRepo.find({ where: { id: In(uniqueSpaceIds) } });
    }
    if (uniqueChannelIds.length) {
      channels = await this.channelRepo.find({
        where: { id: In(uniqueChannelIds) },
      });
    }

    const spaceNameById = new Map<string, string | null>();
    for (const s of spaces) {
      const id = String((s as any).id);
      const name: string | null = (s as any).name ?? (s as any).title ?? null;
      spaceNameById.set(id, name);
    }

    const channelNameById = new Map<string, string | null>();
    for (const c of channels) {
      const id = String((c as any).id);
      const name: string | null = (c as any).name ?? (c as any).title ?? null;
      channelNameById.set(id, name);
    }

    // 3) userState (lido/ack) e minha reação
    const eventMeta = await this.detectEventMeta();
    let readMap = new Map<
      string,
      { isRead: boolean; readAt?: string | null }
    >();
    if (eventMeta && newsIds.length) {
      const { table, typeCol, newsRef, userIdCol, createdAtCol } = eventMeta;
      const p: any[] = [companyId, userId];
      let sql = `SELECT "${newsRef}" AS nid, MAX("${createdAtCol}") AS ra
         FROM ${table}
         WHERE "companyId"=$1 AND "${userIdCol}"=$2
           AND (${typeCol} IN ('OPEN','open','ACK','ack'))
           AND "${newsRef}" IN (`;
      const ph = newsIds.map((_, i) => `$${i + 3}`).join(',');
      sql += ph + `) GROUP BY "${newsRef}"`;
      p.push(...newsIds);

      const rr = await this.newsRepo.query(sql, p);
      readMap = new Map(
        rr.map((r: any) => [
          String(r.nid),
          { isRead: true, readAt: r.ra ? new Date(r.ra).toISOString() : null },
        ]),
      );
    }

    let myReactionByNews = new Map<string, ReactionKind | null>();
    if (newsIds.length) {
      const r = await this.reactionRepo.query(
        `SELECT "newsId" AS nid, reaction
         FROM news_reaction
         WHERE "companyId"=$1 AND "userId"=$2 AND "newsId" IN (${newsIds.map((_, i) => `$${i + 3}`).join(',')})`,
        [companyId, userId, ...newsIds],
      );
      myReactionByNews = new Map(
        r.map((x: any) => [String(x.nid), String(x.reaction) as ReactionKind]),
      );
    }

    // 4) contagens por notícia
    let uniqueOpensByNews = new Map<string, number>();
    let acksByNews = new Map<string, number>();

    if (eventMeta && newsIds.length) {
      const { table, typeCol, newsRef, userIdCol } = eventMeta;

      // unique opens
      {
        const p: any[] = [companyId];
        let sql = `SELECT "${newsRef}" AS nid, COUNT(DISTINCT "${userIdCol}")::int AS c
           FROM ${table}
           WHERE "companyId"=$1 AND (${typeCol} IN ('OPEN','open'))
             AND "${newsRef}" IN (`;
        const ph = newsIds.map((_, i) => `$${i + 2}`).join(',');
        sql += ph + `) GROUP BY "${newsRef}"`;
        p.push(...newsIds);

        const rowsU = await this.newsRepo.query(sql, p);
        uniqueOpensByNews = new Map(
          rowsU.map((r: any) => [String(r.nid), toInt(r.c)]),
        );
      }
      // acks (distinct users)
      {
        const p: any[] = [companyId];
        let sql = `SELECT "${newsRef}" AS nid, COUNT(DISTINCT "${userIdCol}")::int AS c
           FROM ${table}
           WHERE "companyId"=$1 AND (${typeCol} IN ('ACK','ack'))
             AND "${newsRef}" IN (`;
        const ph = newsIds.map((_, i) => `$${i + 2}`).join(',');
        sql += ph + `) GROUP BY "${newsRef}"`;
        p.push(...newsIds);

        const rowsA = await this.newsRepo.query(sql, p);
        acksByNews = new Map(
          rowsA.map((r: any) => [String(r.nid), toInt(r.c)]),
        );
      }
    }

    // reactions/comments/shares
    let reactionsTotalByNews = new Map<string, number>();
    if (newsIds.length) {
      const r = await this.reactionRepo.query(
        `SELECT "newsId" AS nid, COUNT(*)::int AS c
         FROM news_reaction WHERE "companyId"=$1 AND "newsId" IN (${newsIds.map((_, i) => `$${i + 2}`).join(',')})
         GROUP BY "newsId"`,
        [companyId, ...newsIds],
      );
      reactionsTotalByNews = new Map(
        r.map((x: any) => [String(x.nid), toInt(x.c)]),
      );
    }

    let commentsTotalByNews = new Map<string, number>();
    if (newsIds.length) {
      const r = await this.commentRepo.query(
        `SELECT "newsId" AS nid, COUNT(*)::int AS c
         FROM news_comment
         WHERE "companyId"=$1 AND status='approved' AND "newsId" IN (${newsIds.map((_, i) => `$${i + 2}`).join(',')})
         GROUP BY "newsId"`,
        [companyId, ...newsIds],
      );
      commentsTotalByNews = new Map(
        r.map((x: any) => [String(x.nid), toInt(x.c)]),
      );
    }

    let sharesTotalByNews = new Map<string, number>();
    if (newsIds.length) {
      const r = await this.shareRepo.query(
        `SELECT "newsId" AS nid, COUNT(*)::int AS c
         FROM news_share
         WHERE "companyId"=$1 AND "newsId" IN (${newsIds.map((_, i) => `$${i + 2}`).join(',')})
         GROUP BY "newsId"`,
        [companyId, ...newsIds],
      );
      sharesTotalByNews = new Map(
        r.map((x: any) => [String(x.nid), toInt(x.c)]),
      );
    }

    // 5) montar items
    const items: MeFeedItemDTO[] = slice.map((n: any) => {
      const settingsRaw = safeJson<any>(n.settings, {});
      const settings = {
        acknowledgementRequired:
          (settingsRaw?.acknowledgementRequired ??
            settingsRaw?.ackRequired ??
            false) === true,
        allowReactions: (settingsRaw?.allowReactions ?? true) === true,
        allowComments: (settingsRaw?.allowComments ?? false) === true,
        commentsRequireModeration:
          (settingsRaw?.commentsRequireModeration ??
            settingsRaw?.moderateComments ??
            false) === true,
        shareEnabled: (settingsRaw?.shareEnabled ?? true) === true,
      };

      const isReadInfo = readMap.get(n.id) || { isRead: false, readAt: null };
      const counts = {
        uniqueOpens: uniqueOpensByNews.get(n.id) ?? 0,
        acks: acksByNews.get(n.id) ?? 0,
        reactionsTotal: reactionsTotalByNews.get(n.id) ?? 0,
        commentsTotal: commentsTotalByNews.get(n.id) ?? 0,
        sharesTotal: sharesTotalByNews.get(n.id) ?? 0,
      };

      const hi = safeJson<string[]>(n.highlightImages, []);
      const atts = safeJson<any[]>(n.attachments, [])
        .map((a) => ({
          name: a?.name ?? null,
          url: a?.url ?? a ?? '',
        }))
        .filter((x) => x.url);

      return {
        id: String(n.id),
        createdAt: new Date(n.createdAt).toISOString(),
        updatedAt: n.updatedAt ? new Date(n.updatedAt).toISOString() : null,

        title: String(n.title || ''),
        subtitle: n.subtitle ? String(n.subtitle) : null,
        excerpt: buildExcerpt(n) ?? null,

        highlightImages: hi,
        attachments: atts,

        spaceId: n.spaceId ?? null,
        spaceName: (n.spaceId && spaceNameById.get(String(n.spaceId))) || null,
        channelId: n.channelId ?? null,
        channelName:
          (n.channelId && channelNameById.get(String(n.channelId))) || null,

        settings,
        userState: {
          isRead: !!isReadInfo.isRead,
          readAt: isReadInfo.readAt ?? null,
          myReaction: (myReactionByNews.get(n.id) ??
            null) as ReactionKind | null,
        },
        counts,
      };
    });

    // 6) counters — totalUnread/bySpace/byChannel
    let totalUnread = 0;
    const bySpace: Record<string, number> = {};
    const byChannel: Record<string, number> = {};

    const cParams: any[] = [companyId, userId];
    let cSql = `SELECT n.id, n."spaceId", n."channelId"
       FROM news_entity n
       INNER JOIN news_audience a
           ON a."newsId" = n.id AND a."companyId" = n."companyId" AND a."userId" = $2
       WHERE n."companyId"=$1 AND n.status='published'`;
    let cIdx = 3;
    if (spaceId) {
      cSql += ` AND n."spaceId" = $${cIdx}`;
      cParams.push(spaceId);
      cIdx++;
    }
    if (channelId) {
      cSql += ` AND n."channelId" = $${cIdx}`;
      cParams.push(channelId);
      cIdx++;
    }

    const meta = await this.detectEventMeta();
    if (meta) {
      const { table, typeCol, newsRef, userIdCol } = meta;
      cSql = `SELECT n.id, n."spaceId", n."channelId",
                e._has AS has_ev
         FROM (
           ${cSql}
         ) n
         LEFT JOIN (
           SELECT "${newsRef}" AS nid, 1 AS _has
           FROM ${table}
           WHERE "companyId"=$1 AND "${userIdCol}"=$2
             AND (${typeCol} IN ('OPEN','open','ACK','ack'))
           GROUP BY "${newsRef}"
         ) e ON e.nid = n.id`;
      const all = await this.newsRepo.query(cSql, cParams);
      for (const row of all) {
        if (!row.has_ev) {
          totalUnread++;
          if (row.spaceId) {
            bySpace[row.spaceId] = (bySpace[row.spaceId] || 0) + 1;
          }
          if (row.channelId) {
            byChannel[row.channelId] = (byChannel[row.channelId] || 0) + 1;
          }
        }
      }
    }

    const etag = `${serverTime}:${items.length}:${items[0]?.id ?? ''}`;

    return {
      items,
      counters: { totalUnread, bySpace, byChannel },
      nextCursor,
      etag,
      serverTime,
    };
  }

  // Alias para compat
  async meFeed(companyId: string, userId: string, q: MeFeedQuery) {
    return this.getFeed(companyId, userId, q);
  }
}
