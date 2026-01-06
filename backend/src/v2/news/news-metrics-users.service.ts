import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

function sanitizeAvatar(url: string | null): string | null {
  if (!url || url === 'null') return null;
  return url;
}

export type ActionKind =
  | 'opened'
  | 'acknowledged'
  | 'reacted'
  | 'commented'
  | 'shared'
  | 'favorited';

// Interface para o frontend
export interface UserActionRow {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: string;
  info?: string;
  userId?: string;
  openCount?: number;
  ackCount?: number;
  reactionCount?: number;
  commentCount?: number;
  shareCount?: number;
  favoriteCount?: number;
}

@Injectable()
export class NewsMetricsUsersServiceV2 {
  constructor(private readonly ds: DataSource) { }

  async list(
    companyId: string,
    newsId: string,
    kind: ActionKind,
    opts: { page: number; pageSize: number; q?: string },
  ) {
    const { page, pageSize, q } = opts;
    const offset = (page - 1) * pageSize;
    const params: any[] = [companyId, newsId];
    let whereUser = '';
    const idx = 3;

    if (q?.trim()) {
      whereUser = ` AND (u."name" ILIKE $${idx} OR u."email" ILIKE $${idx})`;
      params.push(`%${q.trim()}%`);
    }

    let table = '',
      extraSelect = '';

    // 🔥 AQUI ESTÁ A CORREÇÃO DOS MODAIS VAZIOS
    switch (kind) {
      case 'reacted':
        table = 'news_reaction';
        extraSelect = ', t.reaction as info';
        break;
      case 'commented':
        table = 'news_comment';
        extraSelect = ', t.text as info';
        break;
      case 'shared':
        table = 'news_share';
        extraSelect = ', t.channel as info';
        break;
      case 'favorited':
        table = 'news_favorite';
        extraSelect = '';
        break;
      case 'acknowledged':
      case 'opened':
      default:
        table = 'news_interaction_event';
        break;
    }

    let sql = '';
    let countSql = '';

    if (kind === 'acknowledged' || kind === 'opened') {
      const typeFilter =
        kind === 'acknowledged'
          ? `UPPER(t.type) IN ('ACK','ACKNOWLEDGE','ACKNOWLEDGED')`
          : `UPPER(t.type) IN ('OPEN','VIEW','OPENED')`;

      sql = `
            SELECT t."userId"::text, t."createdAt", u.name, u.email, u."avatarUrl"
            FROM ${table} t
            JOIN user_entity u ON u.id::text = t."userId"::text
            WHERE t."companyId"=$1 AND t."newsId"=$2 AND ${typeFilter} ${whereUser}
            ORDER BY t."createdAt" DESC LIMIT ${pageSize} OFFSET ${offset}
        `;
      countSql = `SELECT COUNT(*)::int as c FROM ${table} t JOIN user_entity u ON u.id::text = t."userId"::text WHERE t."companyId"=$1 AND t."newsId"=$2 AND ${typeFilter} ${whereUser}`;
    } else {
      // Tabelas dedicadas
      sql = `
            SELECT t."userId"::text, t."createdAt", u.name, u.email, u."avatarUrl" ${extraSelect}
            FROM ${table} t
            JOIN user_entity u ON u.id::text = t."userId"::text
            WHERE t."companyId"=$1 AND t."newsId"=$2 ${whereUser}
            ORDER BY t."createdAt" DESC LIMIT ${pageSize} OFFSET ${offset}
        `;
      countSql = `SELECT COUNT(*)::int as c FROM ${table} t JOIN user_entity u ON u.id::text = t."userId"::text WHERE t."companyId"=$1 AND t."newsId"=$2 ${whereUser}`;
    }

    const countRes = await this.ds.query(countSql, params);
    const total = Number(countRes?.[0]?.c || 0);
    const rows = await this.ds.query(sql, params);

    return {
      items: rows.map((r: any) => ({
        id: r.userId,
        name: r.name,
        email: r.email,
        avatar: sanitizeAvatar(r.avatarUrl),
        createdAt: r.createdAt,
        info: r.info,
        userId: r.userId,
        openCount: 1,
        ackCount: 1,
        reactionCount: 1,
        commentCount: 1,
        shareCount: 1,
        favoriteCount: 1,
      })),
      total,
    };
  }

  // Stubs para compatibilidade (se o frontend antigo ainda chamar)
  async listAll(id: string, kind: string, opts: any) {
    return [];
  }
  async listInteractionsAll(id: string, opts: any) {
    return [];
  }
  async interactionsUniqueCount(id: string, opts: any) {
    return 0;
  }
}
