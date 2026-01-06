// src/news/news-metrics.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InteractionEventEntity } from '../v2/interactions/entities/interaction-event.entity';

export type ActionKind =
  | 'opened'
  | 'acknowledged'
  | 'reacted'
  | 'commented'
  | 'shared';

type ListUsersParams = {
  companyId: string;
  newsId: string;
  kind: ActionKind;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  q?: string;
};

@Injectable()
export class NewsMetricsService {
  constructor(
    @InjectRepository(InteractionEventEntity)
    private readonly interactionRepo: Repository<InteractionEventEntity>,
  ) {}

  private kindsToTypes(kind: ActionKind): string[] {
    switch (kind) {
      case 'opened':
        return ['OPEN'];
      case 'acknowledged':
        return ['ACK', 'ACKNOWLEDGE', 'ACKED'];
      case 'reacted':
        return ['REACTION', 'REACTION_ADD', 'REACTION_ADD_ONE'];
      case 'commented':
        return ['COMMENT', 'COMMENT_ADD'];
      case 'shared':
        return ['SHARE', 'SHARE_ADD'];
      default:
        throw new BadRequestException(`Invalid kind: ${kind as string}`);
    }
  }

  private parseRange(
    fromStr?: string,
    toStr?: string,
  ): { from?: string; to?: string } {
    const isDateOnly = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
    let from: string | undefined;
    let to: string | undefined;
    if (fromStr)
      from = isDateOnly(fromStr) ? `${fromStr}T00:00:00.000Z` : fromStr;
    if (toStr) to = isDateOnly(toStr) ? `${toStr}T23:59:59.999Z` : toStr;
    return { from, to };
  }

  // ========= ROTA PRINCIPAL (tabela unificada) =========
  private async listUsersNIE(params: ListUsersParams) {
    const {
      companyId,
      newsId,
      kind,
      from,
      to,
      limit = 50,
      offset = 0,
      q,
    } = params;

    // Tipos sempre em UPPER para comparação case-insensitive
    const types = this.kindsToTypes(kind).map((t) => t.toUpperCase());
    const { from: fromIso, to: toIso } = this.parseRange(from, to);
    const manager = this.interactionRepo.manager;

    const where: string[] = [
      `e."companyId"::text = $1::text`,
      `e."newsId"::text    = $2::text`,
      // 👇 case-insensitive
      `UPPER(e."type"::text) = ANY($3::text[])`,
    ];
    const args: any[] = [companyId, newsId, types];

    let i = 4;
    if (fromIso) {
      where.push(`e."createdAt" >= $${i}::timestamp`);
      args.push(fromIso);
      i++;
    }
    if (toIso) {
      where.push(`e."createdAt" <= $${i}::timestamp`);
      args.push(toIso);
      i++;
    }

    let qClause = '';
    if (q && q.trim()) {
      qClause = ` AND (
        COALESCE(u."displayName",'') ILIKE $${i}
        OR COALESCE(u."name",'') ILIKE $${i}
        OR COALESCE(u."email",'') ILIKE $${i}
      )`;
      args.push(`%${q.trim()}%`);
      i++;
    }

    const countAlias: string =
      kind === 'opened'
        ? 'openCount'
        : kind === 'acknowledged'
          ? 'ackCount'
          : kind === 'reacted'
            ? 'reactionCount'
            : kind === 'commented'
              ? 'commentCount'
              : 'shareCount';

    // Seleciona displayName também e faz GROUP BY consistente
    const sqlItems = `
      SELECT
        u.id::text AS id,
        u."displayName" AS "displayName",
        u."name" AS "name",
        u."email" AS "email",
        COUNT(*)::int AS "${countAlias}"
      FROM news_interaction_event e
      JOIN user_entity u ON u."id"::text = e."userId"::text
      WHERE ${where.join(' AND ')} ${qClause}
      GROUP BY u.id, u."displayName", u."name", u."email"
      ORDER BY "${countAlias}" DESC,
               COALESCE(NULLIF(u."displayName", ''), NULLIF(u."name", '')) NULLS LAST
      LIMIT $${i} OFFSET $${i + 1}
    `;
    const itemsArgs = [...args, Number(limit), Number(offset)];
    const rows: any[] = await manager.query(sqlItems, itemsArgs);

    const sqlTotal = `
      SELECT COUNT(*)::int AS total
      FROM (
        SELECT 1
        FROM news_interaction_event e
        JOIN user_entity u ON u."id"::text = e."userId"::text
        WHERE ${where.join(' AND ')} ${qClause}
        GROUP BY u.id
      ) t
    `;
    const totalRow = await manager.query(sqlTotal, args);
    const total = Number(totalRow?.[0]?.total ?? 0);

    const normalized = rows.map((r) => ({
      id: r.id,
      // Preferir displayName quando existir
      name:
        r.displayName && String(r.displayName).trim()
          ? r.displayName
          : (r.name ?? null),
      email: r.email ?? null,
      openCount: r.opencount ?? r.openCount ?? undefined,
      ackCount: r.ackcount ?? r.ackCount ?? undefined,
      reactionCount: r.reactioncount ?? r.reactionCount ?? undefined,
      commentCount: r.commentcount ?? r.commentCount ?? undefined,
      shareCount: r.sharecount ?? r.shareCount ?? undefined,
    }));

    return { items: normalized, total };
  }

  // ========= FALLBACK LEGADO =========
  private async listUsersLegacy(params: ListUsersParams) {
    const {
      companyId,
      newsId,
      kind,
      from,
      to,
      limit = 50,
      offset = 0,
      q,
    } = params;
    const { from: fromIso, to: toIso } = this.parseRange(from, to);
    const manager = this.interactionRepo.manager;

    const addRange = (where: string[], args: any[], alias: string) => {
      let i = args.length + 1;
      if (fromIso) {
        where.push(`${alias}."createdAt" >= $${i}::timestamp`);
        args.push(fromIso);
        i++;
      }
      if (toIso) {
        where.push(`${alias}."createdAt" <= $${i}::timestamp`);
        args.push(toIso);
        i++;
      }
      return i;
    };

    const addSearch = (i: number, args: any[]) => {
      let qClause = '';
      if (q && q.trim()) {
        qClause = ` AND (
          COALESCE(u."displayName",'') ILIKE $${i}
          OR COALESCE(u."name",'') ILIKE $${i}
          OR COALESCE(u."email",'') ILIKE $${i}
        )`;
        args.push(`%${q.trim()}%`);
        i++;
      }
      return { qClause, next: i };
    };

    if (kind === 'reacted') {
      const where = [
        `r."companyId"::text = $1::text`,
        `r."newsId"::text = $2::text`,
      ];
      const args: any[] = [companyId, newsId];
      let i = addRange(where, args, 'r');
      const { qClause, next } = addSearch(i, args);
      i = next;

      const itemsSql = `
        WITH agg AS (
          SELECT r."userId" AS "userId",
                 COUNT(*)::int AS "reactionCount",
                 MAX(r."createdAt") AS "lastReactionAt"
            FROM news_reaction r
           WHERE ${where.join(' AND ')}
           GROUP BY r."userId"
        )
        SELECT a."userId"::text AS id,
               u."displayName" AS "displayName",
               u."name" AS name,
               u."email" AS email,
               a."reactionCount" AS "reactionCount"
          FROM agg a
          LEFT JOIN user_entity u ON u."id"::text = a."userId"::text
         WHERE 1=1 ${qClause}
         ORDER BY a."lastReactionAt" DESC NULLS LAST
         LIMIT $${i} OFFSET $${i + 1}
      `;
      const items = await manager.query(itemsSql, [
        ...args,
        Number(limit),
        Number(offset),
      ]);

      const totalSql = `
        WITH agg AS (
          SELECT r."userId" AS "userId"
            FROM news_reaction r
           WHERE ${where.join(' AND ')}
           GROUP BY r."userId"
        )
        SELECT COUNT(*)::int AS total FROM agg
      `;
      const totalRow = await manager.query(totalSql, args);
      const total = Number(totalRow?.[0]?.total ?? 0);

      return {
        items: items.map((r: any) => ({
          id: r.id,
          name:
            r.displayName && String(r.displayName).trim()
              ? r.displayName
              : (r.name ?? null),
          email: r.email ?? null,
          reactionCount: r.reactioncount ?? r.reactionCount ?? undefined,
        })),
        total,
      };
    }

    if (kind === 'shared') {
      const where = [
        `s."companyId"::text = $1::text`,
        `s."newsId"::text = $2::text`,
      ];
      const args: any[] = [companyId, newsId];
      let i = addRange(where, args, 's');
      const { qClause, next } = addSearch(i, args);
      i = next;

      const itemsSql = `
        WITH agg AS (
          SELECT s."userId" AS "userId",
                 COUNT(*)::int AS "shareCount",
                 MAX(s."createdAt") AS "lastShareAt"
            FROM news_share s
           WHERE ${where.join(' AND ')}
           GROUP BY s."userId"
        )
        SELECT a."userId"::text AS id,
               u."displayName" AS "displayName",
               u."name" AS name,
               u."email" AS email,
               a."shareCount" AS "shareCount"
          FROM agg a
          LEFT JOIN user_entity u ON u."id"::text = a."userId"::text
         WHERE 1=1 ${qClause}
         ORDER BY a."lastShareAt" DESC NULLS LAST
         LIMIT $${i} OFFSET $${i + 1}
      `;
      const items = await manager.query(itemsSql, [
        ...args,
        Number(limit),
        Number(offset),
      ]);

      const totalSql = `
        WITH agg AS (
          SELECT s."userId" AS "userId"
            FROM news_share s
           WHERE ${where.join(' AND ')}
           GROUP BY s."userId"
        )
        SELECT COUNT(*)::int AS total FROM agg
      `;
      const totalRow = await manager.query(totalSql, args);
      const total = Number(totalRow?.[0]?.total ?? 0);

      return {
        items: items.map((r: any) => ({
          id: r.id,
          name:
            r.displayName && String(r.displayName).trim()
              ? r.displayName
              : (r.name ?? null),
          email: r.email ?? null,
          shareCount: r.sharecount ?? r.shareCount ?? undefined,
        })),
        total,
      };
    }

    if (kind === 'commented') {
      const where = [
        `c."companyId"::text = $1::text`,
        `c."newsId"::text = $2::text`,
      ];
      const args: any[] = [companyId, newsId];
      let i = addRange(where, args, 'c');
      const { qClause, next } = addSearch(i, args);
      i = next;

      const itemsSql = `
        WITH agg AS (
          SELECT c."userId" AS "userId",
                 COUNT(*)::int AS "commentCount",
                 MAX(c."createdAt") AS "lastCommentAt"
            FROM news_comment c
           WHERE ${where.join(' AND ')}
           GROUP BY c."userId"
        )
        SELECT a."userId"::text AS id,
               u."displayName" AS "displayName",
               u."name" AS name,
               u."email" AS email,
               a."commentCount" AS "commentCount"
          FROM agg a
          LEFT JOIN user_entity u ON u."id"::text = a."userId"::text
         WHERE 1=1 ${qClause}
         ORDER BY a."lastCommentAt" DESC NULLS LAST
         LIMIT $${i} OFFSET $${i + 1}
      `;
      const items = await manager.query(itemsSql, [
        ...args,
        Number(limit),
        Number(offset),
      ]);

      const totalSql = `
        WITH agg AS (
          SELECT c."userId" AS "userId"
            FROM news_comment c
           WHERE ${where.join(' AND ')}
           GROUP BY c."userId"
        )
        SELECT COUNT(*)::int AS total FROM agg
      `;
      const totalRow = await manager.query(totalSql, args);
      const total = Number(totalRow?.[0]?.total ?? 0);

      return {
        items: items.map((r: any) => ({
          id: r.id,
          name:
            r.displayName && String(r.displayName).trim()
              ? r.displayName
              : (r.name ?? null),
          email: r.email ?? null,
          commentCount: r.commentcount ?? r.commentCount ?? undefined,
        })),
        total,
      };
    }

    return { items: [], total: 0 };
  }

  async listUsersByAction(params: ListUsersParams) {
    try {
      return await this.listUsersNIE(params);
    } catch (e: any) {
      // Cai para o legado apenas em erros de compatibilidade de schema
      const msg = String(e?.message || '').toLowerCase();
      const compat =
        msg.includes('relation') ||
        msg.includes('column') ||
        msg.includes('operator does not exist') ||
        msg.includes('uuid') ||
        msg.includes('character varying');
      if (!compat) throw e;
      return await this.listUsersLegacy(params);
    }
  }
}
