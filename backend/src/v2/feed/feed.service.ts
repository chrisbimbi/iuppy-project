import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { MeFeedResponseDTO } from '../me/dto/me-feed.dto';

@Injectable()
export class FeedV2Service {
  constructor(private readonly ds: DataSource) {}

  // --- helpers de introspecção ---
  private async regclass(name: string) {
    const r = await this.ds.query(`SELECT to_regclass($1) AS t`, [name]);
    return !!r?.[0]?.t;
  }
  private async colExists(table: string, column: string) {
    const r = await this.ds.query(
      `SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name=$1 AND column_name=$2 LIMIT 1`,
      [table, column],
    );
    return r.length > 0;
  }
  private async pickEventsSource() {
    // prefere a tabela nova
    if (await this.regclass('public.news_interaction_event')) {
      const typeCol = (await this.colExists('news_interaction_event', 'type'))
        ? 'type'
        : (await this.colExists('news_interaction_event', 'event')) ? 'event' : null;
      return { table: 'news_interaction_event', typeCol: typeCol ?? 'type' };
    }
    // fallback: tabela legado
    if (await this.regclass('public.interaction_event')) {
      const typeCol = (await this.colExists('interaction_event', 'type'))
        ? 'type'
        : (await this.colExists('interaction_event', 'event')) ? 'event' : 'type';
      return { table: 'interaction_event', typeCol };
    }
    // último recurso: usa nomes da nova
    return { table: 'news_interaction_event', typeCol: 'type' };
  }

  async getFeed(
    companyId: string,
    userId: string,
    opts?: { limit?: number; cursor?: string | null; spaceId?: string; channelId?: string }
  ): Promise<MeFeedResponseDTO> {
    const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 50);
    const cursor = opts?.cursor ?? null;
    const spaceId = opts?.spaceId ?? null;
    const channelId = opts?.channelId ?? null;

    const { table: evTable, typeCol } = await this.pickEventsSource();

    const params: any[] = [companyId, userId];
    const filters: string[] = [
      `n."companyId" = $1`,
      `na."userId" = $2`,
      `n."status" = 'published'`,
    ];

    if (spaceId) {
      filters.push(`n."spaceId" = $${params.length + 1}`);
      params.push(spaceId);
    }
    if (channelId) {
      filters.push(`n."channelId" = $${params.length + 1}`);
      params.push(channelId);
    }

    if (cursor) {
      const [cTime, cId] = cursor.split('|');
      filters.push(`(n."createdAt" < $${params.length + 1} OR (n."createdAt" = $${params.length + 1} AND n."id" < $${params.length + 2}))`);
      params.push(cTime, cId);
    }

    const itemsSql = `
      SELECT
        n."id",
        n."createdAt",
        n."updatedAt",
        n."title",
        n."subtitle",
        COALESCE(n."excerpt", '') AS "excerpt",
        COALESCE(n."highlightImages", ARRAY[]::text[]) AS "highlightImages",
        COALESCE(n."attachments", ARRAY[]::jsonb[]) AS "attachments",
        n."spaceId",
        s."name" AS "spaceName",
        n."channelId",
        ch."name" AS "channelName",
        COALESCE(n."acknowledgementRequired", false) AS "acknowledgementRequired",
        COALESCE(n."allowReactions", true) AS "allowReactions",
        COALESCE(n."allowComments", false) AS "allowComments",
        COALESCE(n."commentsRequireModeration", false) AS "commentsRequireModeration",
        COALESCE(n."shareEnabled", false) AS "shareEnabled",
        EXISTS (
          SELECT 1 FROM "${evTable}" ev
           WHERE ev."companyId" = n."companyId"
             AND (ev."newsId" = n."id" OR ev."objectId" = n."id")
             AND ev."userId" = $2
             AND ev."${typeCol}" IN ('OPEN','ACK','open','ack')
        ) AS "isRead",
        (
          SELECT MIN(ev2."createdAt")::text
            FROM "${evTable}" ev2
           WHERE ev2."companyId" = n."companyId"
             AND (ev2."newsId" = n."id" OR ev2."objectId" = n."id")
             AND ev2."userId" = $2
             AND ev2."${typeCol}" IN ('OPEN','ACK','open','ack')
        ) AS "readAt",
        (
          SELECT r."reaction"
            FROM "news_reaction" r
           WHERE r."newsId" = n."id" AND r."userId" = $2
           LIMIT 1
        ) AS "myReaction",
        (
          SELECT COUNT(DISTINCT evu."userId")
            FROM "${evTable}" evu
           WHERE evu."companyId" = n."companyId"
             AND (evu."newsId" = n."id" OR evu."objectId" = n."id")
             AND evu."${typeCol}" IN ('OPEN','ACK','open','ack')
        )::int AS "uniqueOpens",
        (
          SELECT COUNT(1)
            FROM "${evTable}" eva
           WHERE eva."companyId" = n."companyId"
             AND (eva."newsId" = n."id" OR eva."objectId" = n."id")
             AND eva."${typeCol}" IN ('ACK','ack')
        )::int AS "acks",
        (SELECT COUNT(1) FROM "news_reaction" rr WHERE rr."newsId" = n."id")::int AS "reactionsTotal",
        (SELECT COUNT(1) FROM "news_comment"  cc WHERE cc."newsId" = n."id")::int AS "commentsTotal",
        (SELECT COUNT(1) FROM "news_share"    ss WHERE ss."newsId" = n."id")::int AS "sharesTotal"
      FROM "news" n
      JOIN "news_audience" na ON na."newsId" = n."id"
      LEFT JOIN "space" s ON s."id" = n."spaceId"
      LEFT JOIN "channel" ch ON ch."id" = n."channelId"
      WHERE ${filters.join(' AND ')}
      ORDER BY n."createdAt" DESC, n."id" DESC
      LIMIT ${limit}
    `;

    const rows = await this.ds.query(itemsSql, params);

    let nextCursor: string | null = null;
    if (rows.length === limit) {
      const last = rows[rows.length - 1];
      nextCursor = `${last.createdAt}|${last.id}`;
    }

    // totalUnread
    const unreadSql = `
      SELECT COUNT(1)::int AS c
        FROM "news" n
        JOIN "news_audience" na ON na."newsId" = n."id" AND na."userId" = $2
        LEFT JOIN LATERAL (
          SELECT 1 FROM "${evTable}" ev
           WHERE ev."companyId" = n."companyId"
             AND (ev."newsId" = n."id" OR ev."objectId" = n."id")
             AND ev."userId" = $2
             AND ev."${typeCol}" IN ('OPEN','ACK','open','ack')
           LIMIT 1
        ) ev ON true
       WHERE n."companyId" = $1
         AND n."status" = 'published'
         AND ev IS NULL
    `;
    const unreadR = await this.ds.query(unreadSql, [companyId, userId]);
    const totalUnread = unreadR?.[0]?.c ?? 0;

    // bySpace
    const bySpaceSql = `
      SELECT n."spaceId" AS id, COUNT(1)::int AS c
        FROM "news" n
        JOIN "news_audience" na ON na."newsId" = n."id" AND na."userId" = $2
        LEFT JOIN LATERAL (
          SELECT 1 FROM "${evTable}" ev
           WHERE ev."companyId" = n."companyId"
             AND (ev."newsId" = n."id" OR ev."objectId" = n."id")
             AND ev."userId" = $2
             AND ev."${typeCol}" IN ('OPEN','ACK','open','ack')
           LIMIT 1
        ) ev ON true
       WHERE n."companyId" = $1
         AND n."status" = 'published'
         AND ev IS NULL
       GROUP BY n."spaceId"
    `;
    const bySpaceRows = await this.ds.query(bySpaceSql, [companyId, userId]);
    const bySpace: Record<string, number> = {};
    for (const r of bySpaceRows) if (r.id) bySpace[r.id] = Number(r.c || 0);

    // byChannel
    const byChannelSql = `
      SELECT n."channelId" AS id, COUNT(1)::int AS c
        FROM "news" n
        JOIN "news_audience" na ON na."newsId" = n."id" AND na."userId" = $2
        LEFT JOIN LATERAL (
          SELECT 1 FROM "${evTable}" ev
           WHERE ev."companyId" = n."companyId"
             AND (ev."newsId" = n."id" OR ev."objectId" = n."id")
             AND ev."userId" = $2
             AND ev."${typeCol}" IN ('OPEN','ACK','open','ack')
           LIMIT 1
        ) ev ON true
       WHERE n."companyId" = $1
         AND n."status" = 'published'
         AND ev IS NULL
       GROUP BY n."channelId"
    `;
    const byChannelRows = await this.ds.query(byChannelSql, [companyId, userId]);
    const byChannel: Record<string, number> = {};
    for (const r of byChannelRows) if (r.id) byChannel[r.id] = Number(r.c || 0);

    const items = rows.map((r: any) => ({
      id: r.id,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt ?? null,
      title: r.title,
      subtitle: r.subtitle ?? null,
      excerpt: r.excerpt || null,
      highlightImages: r.highlightImages ?? [],
      attachments: (r.attachments ?? []).map((a: any) => ({
        name: a?.name ?? null,
        url: a?.url ?? a,
      })),
      spaceId: r.spaceId ?? null,
      spaceName: r.spaceName ?? null,
      channelId: r.channelId ?? null,
      channelName: r.channelName ?? null,
      settings: {
        acknowledgementRequired: !!r.acknowledgementRequired,
        allowReactions: !!r.allowReactions,
        allowComments: !!r.allowComments,
        commentsRequireModeration: !!r.commentsRequireModeration,
        shareEnabled: !!r.shareEnabled,
      },
      userState: {
        isRead: !!r.isRead,
        readAt: r.readAt ?? null,
        myReaction: r.myReaction ?? null,
      },
      counts: {
        uniqueOpens: Number(r.uniqueOpens ?? 0),
        acks: Number(r.acks ?? 0),
        reactionsTotal: Number(r.reactionsTotal ?? 0),
        commentsTotal: Number(r.commentsTotal ?? 0),
        sharesTotal: Number(r.sharesTotal ?? 0),
      },
    }));

    const head = items[0]?.id ?? 'none';
    const etag = `v2feed:${head}:${totalUnread}`;
    const serverTime = new Date().toISOString();

    return {
      items,
      counters: { totalUnread, bySpace, byChannel },
      nextCursor,
      etag,
      serverTime,
    };
  }

  // alias para retrocompatibilidade com quem chama meFeed(...)
  meFeed(
    companyId: string,
    userId: string,
    opts?: { limit?: number; cursor?: string | null; spaceId?: string; channelId?: string },
  ) {
    return this.getFeed(companyId, userId, opts);
  }
}