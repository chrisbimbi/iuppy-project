import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TrackSearchDto } from './dto/track-search.dto';

@Injectable()
export class SearchV2Service {
  constructor(private readonly ds: DataSource) {}

  async track(companyId: string, userId: string, dto: TrackSearchDto) {
    // Tenta gravar em analytics_search_event; se não existir, apenas retorna ok.
    try {
      await this.ds.query(
        `INSERT INTO analytics_search_event
          ("companyId","userId","q","tookMs","results","filters","createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,now())`,
        [
          companyId,
          userId,
          dto.q,
          dto.tookMs ?? null,
          dto.results ?? null,
          dto.filters ?? null,
        ],
      );
      return { ok: true, stored: true };
    } catch {
      // fallback: não quebra o fluxo do app
      return {
        ok: true,
        stored: false,
        note: 'table analytics_search_event missing (no-op)',
      };
    }
  }

  async overview(companyId: string, from?: string, to?: string) {
    try {
      const range =
        from && to
          ? `AND e."createdAt" >= $2 AND e."createdAt" < $3`
          : from
            ? `AND e."createdAt" >= $2`
            : to
              ? `AND e."createdAt" < $2`
              : '';

      const params: any[] = [companyId];
      if (from) params.push(from);
      if (to) params.push(to);

      const rows = await this.ds.query(
        `SELECT
           COUNT(*)::int AS "totalSearches",
           COUNT(DISTINCT e."userId")::int AS "uniqueUsers",
           AVG(NULLIF(e."tookMs",0))::float AS "avgTookMs"
         FROM analytics_search_event e
         WHERE e."companyId" = $1
           ${range}`,
        params,
      );

      const topQueries = await this.ds.query(
        `SELECT e."q", COUNT(*)::int AS "count"
           FROM analytics_search_event e
          WHERE e."companyId" = $1
            ${range}
          GROUP BY e."q"
          ORDER BY COUNT(*) DESC
          LIMIT 10`,
        params,
      );

      return {
        from: from ?? null,
        to: to ?? null,
        totalSearches: Number(rows[0]?.totalSearches || 0),
        uniqueUsers: Number(rows[0]?.uniqueUsers || 0),
        avgTookMs: rows[0]?.avgTookMs ? Number(rows[0].avgTookMs) : null,
        topQueries,
      };
    } catch {
      return {
        from: from ?? null,
        to: to ?? null,
        totalSearches: 0,
        uniqueUsers: 0,
        avgTookMs: null,
        topQueries: [],
        note: 'table analytics_search_event missing (no-op)',
      };
    }
  }
}
