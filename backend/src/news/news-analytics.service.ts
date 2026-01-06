import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NewsEntity } from './news.entity';
import { NewsAudienceEntity } from '../v2/interactions/entities/news-audience.entity';
import { InteractionEventEntity } from '../v2/interactions/entities/interaction-event.entity';

type Range = { from?: string; to?: string };
type Page = { limit?: number; offset?: number; q?: string };

@Injectable()
export class NewsAnalyticsService {
  constructor(
    @InjectRepository(NewsEntity)
    private readonly newsRepo: Repository<NewsEntity>,
    @InjectRepository(NewsAudienceEntity)
    private readonly newsAudienceRepo: Repository<NewsAudienceEntity>,
    @InjectRepository(InteractionEventEntity)
    private readonly interactionEventRepo: Repository<InteractionEventEntity>,
    private readonly ds: DataSource,
  ) {}

  private n(v: any, d = 0) {
    const x = Number(v);
    return Number.isFinite(x) ? x : d;
  }

  private async tableExists(name: string): Promise<boolean> {
    const r = await this.ds.query(`SELECT to_regclass($1) IS NOT NULL AS x`, [
      `public.${name}`,
    ]);
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

  async listOpenedUsers(
    newsId: string,
    companyId: string,
    r?: Range,
    p?: Page,
  ): Promise<
    Array<{
      id: string;
      name: string | null;
      email: string | null;
      opensCount: number;
      firstOpenAt: string | null;
      lastOpenAt: string | null;
    }>
  > {
    const range = this.rangeWhere(`e."createdAt"`, r);
    const limit = Math.max(0, this.n(p?.limit ?? 200));
    const offset = Math.max(0, this.n(p?.offset ?? 0));
    const search = this.searchWhere(p?.q);

    const params: any[] = [companyId, newsId, ...range.params];
    const baseIdx = params.length;

    const sql = `WITH agg AS (
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

    const rows = await this.ds.query(sql, [
      ...params,
      ...search.params,
      limit,
      offset,
    ]);
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name ?? null,
      email: r.email ?? null,
      opensCount: this.n(r.openscount),
      firstOpenAt: r.firstopenat ?? null,
      lastOpenAt: r.lastopenat ?? null,
    }));
  }

  async listAcknowledgedUsers(
    newsId: string,
    companyId: string,
    r?: Range,
    p?: Page,
  ): Promise<
    Array<{
      id: string;
      name: string | null;
      email: string | null;
      ackAt: string | null;
    }>
  > {
    const range = this.rangeWhere(`e."createdAt"`, r);
    const limit = Math.max(0, this.n(p?.limit ?? 200));
    const offset = Math.max(0, this.n(p?.offset ?? 0));
    const search = this.searchWhere(p?.q);

    const params: any[] = [companyId, newsId, ...range.params];
    const baseIdx = params.length;

    const sql = `WITH agg AS (
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

    const rows = await this.ds.query(sql, [
      ...params,
      ...search.params,
      limit,
      offset,
    ]);
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name ?? null,
      email: r.email ?? null,
      ackAt: r.ackat ?? null,
    }));
  }

  async listReactedUsers(
    newsId: string,
    companyId: string,
    r?: Range,
    p?: Page,
  ): Promise<
    Array<{
      id: string;
      name: string | null;
      email: string | null;
      reactionsCount: number;
      lastReactionAt: string | null;
    }>
  > {
    const exists = await this.tableExists('news_reaction');
    if (!exists) return [];
    const range = this.rangeWhere(`r."createdAt"`, r);
    const limit = Math.max(0, this.n(p?.limit ?? 200));
    const offset = Math.max(0, this.n(p?.offset ?? 0));
    const search = this.searchWhere(p?.q);

    const params: any[] = [companyId, newsId, ...range.params];
    const baseIdx = params.length;

    const sql = `WITH agg AS (
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

    const rows = await this.ds.query(sql, [
      ...params,
      ...search.params,
      limit,
      offset,
    ]);
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name ?? null,
      email: r.email ?? null,
      reactionsCount: this.n(r.reactionscount),
      lastReactionAt: r.lastreactionat ?? null,
    }));
  }

  async listCommentedUsers(
    newsId: string,
    companyId: string,
    r?: Range,
    p?: Page,
  ): Promise<
    Array<{
      id: string;
      name: string | null;
      email: string | null;
      commentsCount: number;
      lastCommentAt: string | null;
    }>
  > {
    const exists = await this.tableExists('news_comment');
    if (!exists) return [];
    const range = this.rangeWhere(`c."createdAt"`, r);
    const limit = Math.max(0, this.n(p?.limit ?? 200));
    const offset = Math.max(0, this.n(p?.offset ?? 0));
    const search = this.searchWhere(p?.q);

    const params: any[] = [companyId, newsId, ...range.params];
    const baseIdx = params.length;

    const sql = `WITH agg AS (
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

    const rows = await this.ds.query(sql, [
      ...params,
      ...search.params,
      limit,
      offset,
    ]);
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name ?? null,
      email: r.email ?? null,
      commentsCount: this.n(r.commentscount),
      lastCommentAt: r.lastcommentat ?? null,
    }));
  }

  async listSharedUsers(
    newsId: string,
    companyId: string,
    r?: Range,
    p?: Page,
  ): Promise<
    Array<{
      id: string;
      name: string | null;
      email: string | null;
      sharesCount: number;
      lastShareAt: string | null;
    }>
  > {
    const exists = await this.tableExists('news_share');
    if (!exists) return [];
    const range = this.rangeWhere(`s."createdAt"`, r);
    const limit = Math.max(0, this.n(p?.limit ?? 200));
    const offset = Math.max(0, this.n(p?.offset ?? 0));
    const search = this.searchWhere(p?.q);

    const params: any[] = [companyId, newsId, ...range.params];
    const baseIdx = params.length;

    const sql = `WITH agg AS (
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

    const rows = await this.ds.query(sql, [
      ...params,
      ...search.params,
      limit,
      offset,
    ]);
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name ?? null,
      email: r.email ?? null,
      sharesCount: this.n(r.sharescount),
      lastShareAt: r.lastshareat ?? null,
    }));
  }
}
