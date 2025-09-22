import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NewsEntity } from 'src/news/news.entity';
import { NewsReactionEntity } from 'src/v2/interactions/entities/news-reaction.entity';
import { NewsCommentEntity } from 'src/v2/interactions/entities/news-comment.entity';
import { NewsShareEntity } from 'src/v2/interactions/entities/news-share.entity';
import { NewsMetricsDailyEntity } from 'src/v2/interactions/entities/news-metrics-daily.entity';
import { UserMetricsDailyEntity } from 'src/v2/interactions/entities/user-metrics-daily.entity';
import { SearchMetricsDailyEntity } from 'src/v2/interactions/entities/search-metrics-daily.entity';
import { PushDeliveryEntity } from 'src/v2/interactions/entities/push-delivery.entity';
import { NewsAudienceEntity } from 'src/v2/interactions/entities/news-audience.entity';

type ReactionKind = 'like' | 'love' | 'clap' | 'smile' | 'neutral' | 'angry';

function toDateISO(d?: string): string | undefined {
  if (!d) return undefined;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return undefined;
  return dt.toISOString().slice(0, 10);
}

@Injectable()
export class AnalyticsV2Service {
  constructor(
    @InjectRepository(NewsEntity) private readonly newsRepo: Repository<NewsEntity>,
    @InjectRepository(NewsReactionEntity) private readonly reactionRepo: Repository<NewsReactionEntity>,
    @InjectRepository(NewsCommentEntity) private readonly commentRepo: Repository<NewsCommentEntity>,
    @InjectRepository(NewsShareEntity) private readonly shareRepo: Repository<NewsShareEntity>,
    @InjectRepository(NewsMetricsDailyEntity) private readonly nDailyRepo: Repository<NewsMetricsDailyEntity>,
    @InjectRepository(UserMetricsDailyEntity) private readonly uDailyRepo: Repository<UserMetricsDailyEntity>,
    @InjectRepository(SearchMetricsDailyEntity) private readonly sDailyRepo: Repository<SearchMetricsDailyEntity>,
    @InjectRepository(PushDeliveryEntity) private readonly pushRepo: Repository<PushDeliveryEntity>,
    @InjectRepository(NewsAudienceEntity) private readonly audienceRepo: Repository<NewsAudienceEntity>,
  ) { }

  /**
   * Auto-detecção da tabela/colunas de eventos (compat variáveis)
   */
  private async detectEventMeta(): Promise<{
    table: string;
    typeCol: string;
    newsRef: string;
    userIdCol: string;
    createdAtCol: string;
  } | null> {
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
    const typeCol = names.includes('type') ? 'type' : names.includes('event') ? 'event' : null;
    const newsRef = names.includes('newsId') ? 'newsId' : names.includes('objectId') ? 'objectId' : null;
    const userIdCol = names.includes('userId') ? 'userId' : null;
    const createdAtCol = names.includes('createdAt') ? 'createdAt' : null;

    if (!typeCol || !newsRef || !userIdCol || !createdAtCol) return null;
    return { table, typeCol, newsRef, userIdCol, createdAtCol };
  }

  /**
   * Gera SQL de filtro por período e params a partir de um índice base
   */
  private buildBetweenClause(
    colIdent: string, // e.g. "\"createdAt\"" ou "\"date\""
    startIndex: number,
    from?: string,
    to?: string,
  ): { sql: string; params: any[]; nextIndex: number } {
    const f = toDateISO(from);
    const t = toDateISO(to);
    let sql = '';
    const params: any[] = [];
    let idx = startIndex;

    if (f) {
      sql += ` AND ${colIdent} >= $${idx}`;
      params.push(f);
      idx++;
    }
    if (t) {
      sql += ` AND ${colIdent} < ($${idx}::date + INTERVAL '1 day')`;
      params.push(t);
      idx++;
    }
    return { sql, params, nextIndex: idx };
  }

  // =========================
  //       /news/:id
  // =========================
  async newsMetrics(companyId: string, newsId: string, from?: string, to?: string) {
    // recebíveis via snapshot
    const recebivel = await this.audienceRepo.count({ where: { companyId, newsId } });

    // quantos push (se a tabela existir)
    let recebeuPush = 0;
    try {
      recebeuPush = await this.pushRepo.count({ where: { companyId, newsId } });
    } catch {
      recebeuPush = 0;
    }

    // reações por tipo
    const reactionsRows = await this.reactionRepo.query(
      `SELECT "reaction" AS r, COUNT(*)::int AS c
       FROM news_reaction
       WHERE "newsId"=$1 AND "companyId"=$2
       GROUP BY "reaction"`,
      [newsId, companyId],
    );
    const reactionsByType: Record<ReactionKind, number> = {
      like: 0,
      love: 0,
      clap: 0,
      smile: 0,
      neutral: 0,
      angry: 0,
    };
    for (const row of reactionsRows || []) {
      const key = String(row.r) as ReactionKind;
      if (key in reactionsByType) reactionsByType[key] = Number(row.c || 0);
    }

    // comentários (totais/pending/approved/rejected)
    const commentsAgg = await this.commentRepo.query(
      `SELECT
         COUNT(*)::int AS total,
         SUM((status='pending')::int)::int AS pending,
         SUM((status='approved')::int)::int AS approved,
         SUM((status='rejected')::int)::int AS rejected
       FROM news_comment
       WHERE "newsId"=$1 AND "companyId"=$2`,
      [newsId, companyId],
    );
    const comments = (commentsAgg && commentsAgg[0]) || {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    // opens/unique/acks por eventos (com fallback para daily)
    let totalOpens = 0;
    let uniqueOpens = 0;
    let acks = 0;

    const meta = await this.detectEventMeta();
    if (meta) {
      const { table, typeCol, newsRef, userIdCol, createdAtCol } = meta;
      // total opens
      {
        const baseParams = [companyId, newsId];
        const between = this.buildBetweenClause(`"${createdAtCol}"`, 3, from, to);
        const sql =
          `SELECT COUNT(*)::int AS c
           FROM ${table}
           WHERE "companyId"=$1 AND "${newsRef}"=$2
             AND (${typeCol} IN ('OPEN','open'))` + between.sql;
        const rows = await this.newsRepo.query(sql, baseParams.concat(between.params));
        totalOpens = rows && rows[0] && rows[0].c ? Number(rows[0].c) : 0;
      }
      // unique opens
      {
        const baseParams = [companyId, newsId];
        const between = this.buildBetweenClause(`"${createdAtCol}"`, 3, from, to);
        const sql =
          `SELECT COUNT(DISTINCT "${userIdCol}")::int AS c
           FROM ${table}
           WHERE "companyId"=$1 AND "${newsRef}"=$2
             AND (${typeCol} IN ('OPEN','open'))` + between.sql;
        const rows = await this.newsRepo.query(sql, baseParams.concat(between.params));
        uniqueOpens = rows && rows[0] && rows[0].c ? Number(rows[0].c) : 0;
      }
      // acks (unique por user)
      {
        const baseParams = [companyId, newsId];
        const between = this.buildBetweenClause(`"${createdAtCol}"`, 3, from, to);
        const sql =
          `SELECT COUNT(DISTINCT "${userIdCol}")::int AS c
           FROM ${table}
           WHERE "companyId"=$1 AND "${newsRef}"=$2
             AND (${typeCol} IN ('ACK','ack'))` + between.sql;
        const rows = await this.newsRepo.query(sql, baseParams.concat(between.params));
        acks = rows && rows[0] && rows[0].c ? Number(rows[0].c) : 0;
      }
    } else {
      // fallback por pré-agregações (sem filtro de período)
      const rows = await this.nDailyRepo.find({ where: { newsId } });
      if (rows && rows.length) {
        totalOpens = rows.reduce((s, r) => s + (r.opens || 0), 0);
        uniqueOpens = rows.reduce((s, r) => s + (r.uniqueOpens || 0), 0);
        acks = rows.reduce((s, r) => s + (r.acks || 0), 0);
      }
    }

    // série diária (news_metrics_daily)
    const f = toDateISO(from);
    const t = toDateISO(to);
    {
      const params: any[] = [newsId];
      let sql =
        `SELECT to_char(d."date",'YYYY-MM-DD') AS date,
                d.opens::int, d."uniqueOpens"::int, d.acks::int,
                d.reactions::int, d.comments::int, d.shares::int
         FROM news_metrics_daily d
         WHERE d."newsId"=$1`;

      let nextIndex = 2;
      if (f) {
        sql += ` AND d."date" >= $${nextIndex}`;
        params.push(f);
        nextIndex++;
      }
      if (t) {
        sql += ` AND d."date" < ($${nextIndex}::date + INTERVAL '1 day')`;
        params.push(t);
        nextIndex++;
      }
      sql += ` ORDER BY d."date" ASC`;

      var seriesDaily = await this.nDailyRepo.query(sql, params);
    }

    // heatmap por hora/dia (eventos OPEN)
    let heatmap: Array<{ hour: number; dow: number; count: number }> = [];
    {
      const meta2 = await this.detectEventMeta();
      if (meta2) {
        const { table, typeCol, createdAtCol, newsRef } = meta2;
        const params: any[] = [companyId, newsId];
        let sql =
          `SELECT EXTRACT(HOUR FROM "${createdAtCol}")::int AS hour,
                  EXTRACT(DOW  FROM "${createdAtCol}")::int AS dow,
                  COUNT(*)::int AS count
           FROM ${table}
           WHERE "companyId"=$1 AND "${newsRef}"=$2
             AND (${typeCol} IN ('OPEN','open'))`;

        const between = this.buildBetweenClause(`"${createdAtCol}"`, 3, from, to);
        sql += between.sql;
        heatmap = await this.newsRepo.query(sql, params.concat(between.params));
      }
    }

    // % que abriram em até 24h após push
    let opens24hAposPushPct = 0;
    try {
      const pushed = await this.pushRepo.query(
        `SELECT "userId", COALESCE("deliveredAt","createdAt") AS t
         FROM push_delivery
         WHERE "companyId"=$1 AND "newsId"=$2`,
        [companyId, newsId],
      );
      const meta3 = await this.detectEventMeta();
      if (pushed && pushed.length && meta3) {
        const { table, typeCol, newsRef, userIdCol, createdAtCol } = meta3;
        let matched = 0;
        for (const p of pushed) {
          const start = new Date(p.t);
          const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
          const rows = await this.newsRepo.query(
            `SELECT 1
             FROM ${table}
             WHERE "companyId"=$1 AND "${newsRef}"=$2
               AND "${userIdCol}"=$3
               AND (${typeCol} IN ('OPEN','open'))
               AND "${createdAtCol}" >= $4 AND "${createdAtCol}" < $5
             LIMIT 1`,
            [companyId, newsId, p.userId, start.toISOString(), end.toISOString()],
          );
          if (rows && rows.length) matched++;
        }
        opens24hAposPushPct = pushed.length ? Math.round((matched / pushed.length) * 100) : 0;
      }
    } catch {
      // silencia caso push_delivery não exista
    }

    return {
      newsId,
      recebivel,
      recebeuPush,
      totalOpens,
      uniqueOpens,
      acks,
      reactionsByType,
      comments: {
        total: Number(comments.total || 0),
        pending: Number(comments.pending || 0),
        approved: Number(comments.approved || 0),
        rejected: Number(comments.rejected || 0),
      },
      opens24hAposPushPct,
      seriesDaily,
      heatmap,
    };
  }

  // =========================
  //   /analytics/news/overview
  // =========================
  async newsOverview(
    companyId: string,
    params: { from?: string; to?: string; spaceId?: string; channelId?: string; groupId?: string },
  ) {
    const f = toDateISO(params.from);
    const t = toDateISO(params.to);

    // lista de posts publicados no período
    {
      const p: any[] = [companyId];
      let sql =
        `SELECT n.id, n.title, n."spaceId", n."channelId"
         FROM news_entity n
         WHERE n."companyId"=$1 AND n.status='published'`;

      let idx = 2;
      if (f) {
        sql += ` AND n."createdAt" >= $${idx}`;
        p.push(f);
        idx++;
      }
      if (t) {
        sql += ` AND n."createdAt" < ($${idx}::date + INTERVAL '1 day')`;
        p.push(t);
        idx++;
      }
      if (params.spaceId) {
        sql += ` AND n."spaceId" = $${idx}`;
        p.push(params.spaceId);
        idx++;
      }
      if (params.channelId) {
        sql += ` AND n."channelId" = $${idx}`;
        p.push(params.channelId);
        idx++;
      }

      var posts = await this.newsRepo.query(sql, p);
    }

    const postIds: string[] = (posts || []).map((p: any) => p.id);
    let opens = 0,
      uniqueOpens = 0,
      acks = 0,
      reactions = 0,
      comments = 0,
      shares = 0;

    if (postIds.length) {
      // somatório via news_metrics_daily (com período)
      const baseParams: any[] = [];
      let sql =
        `SELECT
           COALESCE(SUM(opens),0)::int AS opens,
           COALESCE(SUM("uniqueOpens"),0)::int AS "uniqueOpens",
           COALESCE(SUM(acks),0)::int AS acks,
           COALESCE(SUM(reactions),0)::int AS reactions,
           COALESCE(SUM(comments),0)::int AS comments,
           COALESCE(SUM(shares),0)::int AS shares
         FROM news_metrics_daily
         WHERE "newsId" IN (`;

      // placeholders dinâmicos para IN (...)
      const placeholders = postIds.map((_, i) => `$${i + 1}`).join(',');
      sql += placeholders + ')';

      baseParams.push(...postIds);
      let nextIdx = postIds.length + 1;

      if (f) {
        sql += ` AND "date" >= $${nextIdx}`;
        baseParams.push(f);
        nextIdx++;
      }
      if (t) {
        sql += ` AND "date" < ($${nextIdx}::date + INTERVAL '1 day')`;
        baseParams.push(t);
        nextIdx++;
      }

      const rows = await this.nDailyRepo.query(sql, baseParams);
      if (rows && rows[0]) {
        opens = Number(rows[0].opens || 0);
        uniqueOpens = Number(rows[0].uniqueOpens || 0);
        acks = Number(rows[0].acks || 0);
        reactions = Number(rows[0].reactions || 0);
        comments = Number(rows[0].comments || 0);
        shares = Number(rows[0].shares || 0);
      }
    }

    // heatmap do período para todos os posts (eventos OPEN)
    let heatmap: Array<{ hour: number; dow: number; count: number }> = [];
    if (postIds.length) {
      const meta = await this.detectEventMeta();
      if (meta) {
        const { table, typeCol, createdAtCol, newsRef } = meta;
        const p: any[] = [companyId];
        let sql =
          `SELECT EXTRACT(HOUR FROM "${createdAtCol}")::int AS hour,
                  EXTRACT(DOW  FROM "${createdAtCol}")::int AS dow,
                  COUNT(*)::int AS count
           FROM ${table}
           WHERE "companyId"=$1
             AND "${newsRef}" IN (`;

        // placeholders dos newsIds
        const inPlaceholders = postIds.map((_, i) => `$${i + 2}`).join(',');
        sql += inPlaceholders + ')';
        p.push(...postIds);

        let nextIdx = postIds.length + 2;
        if (f) {
          sql += ` AND "${createdAtCol}" >= $${nextIdx}`;
          p.push(f);
          nextIdx++;
        }
        if (t) {
          sql += ` AND "${createdAtCol}" < ($${nextIdx}::date + INTERVAL '1 day')`;
          p.push(t);
          nextIdx++;
        }
        sql += ` AND (${typeCol} IN ('OPEN','open')) GROUP BY 1,2 ORDER BY 2,1`;

        heatmap = await this.newsRepo.query(sql, p);
      }
    }

    return {
      period: { from: f ?? null, to: t ?? null },
      posts: postIds.length,
      opens,
      uniqueOpens,
      acks,
      reactions,
      comments,
      shares,
      postsComInteracaoPct: postIds.length ? Math.round((Math.min(uniqueOpens, postIds.length) / postIds.length) * 100) : 0,
      heatmap,
      topPosts: [], // (pode ser preenchido numa próxima iteração)
      bySpace: [],
      byChannel: [],
      byGroup: [],
    };
  }

  // =========================
  //   /analytics/users/overview
  // =========================
  async usersOverview(
    companyId: string,
    params: { from?: string; to?: string; spaceId?: string; channelId?: string; groupId?: string },
  ) {
    const f = toDateISO(params.from);
    const t = toDateISO(params.to);

    const totalUsersRow = await this.newsRepo.query(
      `SELECT COUNT(*)::int AS c FROM users WHERE "companyId"=$1`,
      [companyId],
    );
    const totalColaboradores = totalUsersRow && totalUsersRow[0] && totalUsersRow[0].c ? Number(totalUsersRow[0].c) : 0;

    const registradosApp = totalColaboradores; // placeholder (ajustar se houver critério de “registrado”)

    // ativos/engajados via user_metrics_daily
    {
      const p: any[] = [];
      let sql =
        `SELECT
           COUNT(DISTINCT "userId")::int AS ativos,
           COUNT(DISTINCT CASE WHEN (appOpens + newsOpens + reactions + comments + shares + surveyResponses) > 0 THEN "userId" END)::int AS engajados
         FROM user_metrics_daily
         WHERE 1=1`;

      let idx = 1;
      if (f) {
        sql += ` AND "date" >= $${idx}`;
        p.push(f);
        idx++;
      }
      if (t) {
        sql += ` AND "date" < ($${idx}::date + INTERVAL '1 day')`;
        p.push(t);
        idx++;
      }

      var rows = await this.uDailyRepo.query(sql, p);
    }

    const ativosPeriodo = rows && rows[0] && rows[0].ativos ? Number(rows[0].ativos) : 0;
    const engajadosPeriodo = rows && rows[0] && rows[0].engajados ? Number(rows[0].engajados) : 0;

    const funnelPct = {
      registrados: totalColaboradores ? Math.round((registradosApp / totalColaboradores) * 100) : 0,
      ativos: totalColaboradores ? Math.round((ativosPeriodo / totalColaboradores) * 100) : 0,
      engajados: totalColaboradores ? Math.round((engajadosPeriodo / totalColaboradores) * 100) : 0,
    };

    return {
      period: { from: f ?? null, to: t ?? null },
      totalColaboradores,
      registradosApp,
      ativosPeriodo,
      engajadosPeriodo,
      funnelPct,
      heatmapAppOpen: [],
      topInteractions: [
        { type: 'open', count: 0 },
        { type: 'ack', count: 0 },
        { type: 'reaction', count: 0 },
        { type: 'comment', count: 0 },
        { type: 'share', count: 0 },
      ],
    };
  }

  // =========================
  //   /analytics/search/overview
  // =========================
  async searchOverview(companyId: string, params: { from?: string; to?: string }) {
    const f = toDateISO(params.from);
    const t = toDateISO(params.to);

    // totais
    const p1: any[] = [companyId];
    let sql1 =
      `SELECT
         COALESCE(SUM(queries),0)::int AS totalQueries,
         COALESCE(SUM(uniqueUsers),0)::int AS uniqueUsers
       FROM search_metrics_daily
       WHERE "companyId"=$1`;
    let idx1 = 2;
    if (f) {
      sql1 += ` AND "date" >= $${idx1}`;
      p1.push(f);
      idx1++;
    }
    if (t) {
      sql1 += ` AND "date" < ($${idx1}::date + INTERVAL '1 day')`;
      p1.push(t);
      idx1++;
    }
    const rows1 = await this.sDailyRepo.query(sql1, p1);

    // top queries
    const p2: any[] = [companyId];
    let sql2 =
      `SELECT "queryHash" AS hash,
              MAX("sampleQuery") AS sample,
              SUM(queries)::int AS count,
              SUM(uniqueUsers)::int AS "uniqueUsers"
       FROM search_metrics_daily
       WHERE "companyId"=$1`;
    let idx2 = 2;
    if (f) {
      sql2 += ` AND "date" >= $${idx2}`;
      p2.push(f);
      idx2++;
    }
    if (t) {
      sql2 += ` AND "date" < ($${idx2}::date + INTERVAL '1 day')`;
      p2.push(t);
      idx2++;
    }
    sql2 += ` GROUP BY "queryHash" ORDER BY count DESC LIMIT 20`;
    const rows2 = await this.sDailyRepo.query(sql2, p2);

    return {
      period: { from: f ?? null, to: t ?? null },
      totalQueries: rows1 && rows1[0] && rows1[0].totalQueries ? Number(rows1[0].totalQueries) : 0,
      uniqueUsers: rows1 && rows1[0] && rows1[0].uniqueUsers ? Number(rows1[0].uniqueUsers) : 0,
      topQueries: rows2 || [],
    };
  }
}