import { Controller, Get, Post, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { SchemaIntrospectorV2 } from '../common/schema-introspector.v2';

type CommentStatus = 'all' | 'pending' | 'approved' | 'rejected';

const toYMD = (s?: string | null) =>
  s ? new Date(s).toISOString().slice(0, 10) : undefined;

@Controller('v2/news')
export class NewsCommentsControllerV2 {
  constructor(
    private readonly ds: DataSource,
    private readonly schema: SchemaIntrospectorV2,
  ) {}

  // ---- schema helpers ----
  private hasTable() {
    return this.schema.hasTable('news_comment');
  }
  private hasApprovedCol() {
    return this.schema.hasColumn('news_comment', 'approved');
  }
  private hasStatusCol() {
    return this.schema.hasColumn('news_comment', 'status');
  }

  // ---- companyId robusto: user/header/query → fallback por newsId ----
  private async resolveCompanyId(
    req: Request,
    newsId: string,
  ): Promise<string | null> {
    const fromReq =
      (req as any)?.user?.companyId ||
      (req.headers['x-company-id'] as string) ||
      (req.query.companyId as string);
    if (fromReq && String(fromReq).trim()) return String(fromReq);
    const r = await this.ds.query(
      `SELECT "companyId"::text AS cid FROM news_entity WHERE id::text = $1 LIMIT 1`,
      [newsId],
    );
    return r?.[0]?.cid ?? null;
  }

  // ---- WHERE dinâmico (sem forçar approved=true) ----
  private buildWhere(args: {
    companyId: string | null;
    newsId: string;
    yFrom?: string;
    yTo?: string;
    q?: string;
    status?: CommentStatus;
    hasApproved: boolean;
    hasStatus: boolean;
    withUserJoin: boolean;
  }) {
    const {
      companyId,
      newsId,
      yFrom,
      yTo,
      q,
      status,
      hasApproved,
      hasStatus,
      withUserJoin,
    } = args;
    const where: string[] = [];
    const params: any[] = [];

    where.push(`c."newsId" = $${params.length + 1}`);
    params.push(newsId);
    if (companyId) {
      where.push(`c."companyId" = $${params.length + 1}`);
      params.push(companyId);
    }

    const st = ((status || 'all') as string).toLowerCase() as CommentStatus;
    if (st !== 'all') {
      if (hasApproved) {
        if (st === 'approved') where.push(`c."approved" = TRUE`);
        else if (st === 'rejected') where.push(`c."approved" = FALSE`);
        else if (st === 'pending') where.push(`c."approved" IS NULL`);
      } else if (hasStatus) {
        // status textual
        if (st === 'pending') {
          where.push(`(c."status" IS NULL OR UPPER(c."status")='PENDING')`);
        } else {
          where.push(`UPPER(c."status") = $${params.length + 1}`);
          params.push(st.toUpperCase());
        }
      }
    }

    if (yFrom) {
      where.push(`c."createdAt" >= $${params.length + 1}::date`);
      params.push(yFrom);
    }
    if (yTo) {
      where.push(
        `c."createdAt" < ($${params.length + 1}::date + INTERVAL '1 day')`,
      );
      params.push(yTo);
    }

    if (q && String(q).trim()) {
      const like = `%${String(q).trim()}%`;
      const userBits = withUserJoin
        ? ` OR u."email" ILIKE $${params.length + 2}
            OR COALESCE(NULLIF(u."displayName", ''), NULLIF(u."name", '')) ILIKE $${params.length + 3}`
        : '';
      where.push(`(c."text" ILIKE $${params.length + 1}${userBits})`);
      params.push(like);
      if (withUserJoin) params.push(like, like);
    }

    return { whereSql: where.join(' AND '), params };
  }

  // =========================================================================================
  // GET /v2/news/:newsId/comments/summary  → { total, pending, approved, rejected }
  // (usa busca por texto/nome/email quando q=... for fornecido)
  // =========================================================================================
  @Get(':newsId/comments/summary')
  async summary(
    @Req() req: Request,
    @Param('newsId') newsId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('q') q?: string,
  ) {
    if (!(await this.hasTable())) {
      return { total: 0, pending: 0, approved: 0, rejected: 0 };
    }

    const companyId = await this.resolveCompanyId(req, newsId);
    const hasApproved = await this.hasApprovedCol();
    const hasStatus = await this.hasStatusCol();

    const yFrom = toYMD(from);
    const yTo = toYMD(to);
    const withUserJoin = !!(q && String(q).trim());

    const { whereSql, params } = this.buildWhere({
      companyId,
      newsId,
      yFrom,
      yTo,
      q,
      status: 'all',
      hasApproved,
      hasStatus,
      withUserJoin,
    });
    const joinUser = withUserJoin
      ? `JOIN user_entity u ON u.id::text = c."userId"::text`
      : '';

    let sql: string;
    if (hasApproved) {
      sql = `
        SELECT
          COUNT(*)::int AS total,
          SUM((c."approved" IS NULL)::int)::int AS pending,
          SUM((c."approved" = TRUE)::int)::int AS approved,
          SUM((c."approved" = FALSE)::int)::int AS rejected
        FROM news_comment c
        ${joinUser}
        WHERE ${whereSql}
      `;
    } else if (hasStatus) {
      sql = `
        SELECT
          COUNT(*)::int AS total,
          SUM((c."status" IS NULL OR UPPER(c."status")='PENDING')::int)::int  AS pending,
          SUM((UPPER(c."status")='APPROVED')::int)::int AS approved,
          SUM((UPPER(c."status")='REJECTED')::int)::int AS rejected
        FROM news_comment c
        ${joinUser}
        WHERE ${whereSql}
      `;
    } else {
      // sem approved/status: considera tudo como "approved" por compat
      sql = `
        SELECT
          COUNT(*)::int AS total,
          0::int AS pending,
          COUNT(*)::int AS approved,
          0::int AS rejected
        FROM news_comment c
        ${joinUser}
        WHERE ${whereSql}
      `;
    }

    const r = await this.ds.query(sql, params);
    return r?.[0] ?? { total: 0, pending: 0, approved: 0, rejected: 0 };
  }

  // =========================================================================================
  // POST /v2/news/:newsId/comments/:commentId/approve
  // =========================================================================================
  @Post(':newsId/comments/:commentId/approve')
  async approve(
    @Req() req: Request,
    @Param('newsId') newsId: string,
    @Param('commentId') commentId: string,
  ) {
    if (!(await this.hasTable())) return { ok: false };
    const companyId = await this.resolveCompanyId(req, newsId);
    const hasApproved = await this.hasApprovedCol();
    const hasStatus = await this.hasStatusCol();
    if (!hasApproved && !hasStatus) return { ok: true };

    const where: string[] = [`"newsId" = $1`, `"id"::text = $2`];
    const params: any[] = [newsId, commentId];
    if (companyId) {
      where.push(`"companyId" = $${params.length + 1}`);
      params.push(companyId);
    }

    const setFrag = hasApproved ? `"approved" = TRUE` : `"status" = 'APPROVED'`;
    await this.ds.query(
      `UPDATE news_comment SET ${setFrag} WHERE ${where.join(' AND ')}`,
      params,
    );
    return { ok: true };
  }

  // =========================================================================================
  // POST /v2/news/:newsId/comments/:commentId/reject
  // =========================================================================================
  @Post(':newsId/comments/:commentId/reject')
  async reject(
    @Req() req: Request,
    @Param('newsId') newsId: string,
    @Param('commentId') commentId: string,
  ) {
    if (!(await this.hasTable())) return { ok: false };
    const companyId = await this.resolveCompanyId(req, newsId);
    const hasApproved = await this.hasApprovedCol();
    const hasStatus = await this.hasStatusCol();
    if (!hasApproved && !hasStatus) return { ok: true };

    const where: string[] = [`"newsId" = $1`, `"id"::text = $2`];
    const params: any[] = [newsId, commentId];
    if (companyId) {
      where.push(`"companyId" = $${params.length + 1}`);
      params.push(companyId);
    }

    const setFrag = hasApproved
      ? `"approved" = FALSE`
      : `"status" = 'REJECTED'`;
    await this.ds.query(
      `UPDATE news_comment SET ${setFrag} WHERE ${where.join(' AND ')}`,
      params,
    );
    return { ok: true };
  }
}
