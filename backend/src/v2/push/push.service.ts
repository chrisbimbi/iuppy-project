import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SchemaIntrospectorV2 } from '../common/schema-introspector.v2';

@Injectable()
export class PushV2Service {
  constructor(
    private readonly ds: DataSource,
    private readonly schema: SchemaIntrospectorV2,
  ) {}

  private async ensureNews(companyId: string, newsId: string) {
    const sql = `
      WITH t AS (
        SELECT to_regclass('public.news_entity') AS ne, to_regclass('public.news') AS n
      )
      SELECT COALESCE(
        (SELECT json_build_object('id',e.id,'companyId',e."companyId",'title',e.title) FROM news_entity e WHERE e.id=$1 LIMIT 1),
        (SELECT json_build_object('id',e.id,'companyId',e."companyId",'title',e.title) FROM news e WHERE e.id=$1 LIMIT 1)
      ) AS obj
      FROM t
    `;
    const r = await this.ds.query(sql, [newsId]);
    const obj = r?.[0]?.obj;
    if (!obj || obj.companyId !== companyId) {
      throw new ForbiddenException('News not accessible for this company');
    }
    return obj;
  }

  async enqueueRemind(
    companyId: string,
    newsId: string,
    actorUserId: string,
    onlyNotOpened: boolean,
  ) {
    await this.ensureNews(companyId, newsId);

    try {
      const audienceSql = `
        WITH has_audience AS (
          SELECT to_regclass('public.news_audience') IS NOT NULL AS exists
        )
        SELECT
          CASE WHEN (SELECT exists FROM has_audience)
               THEN (SELECT array_agg(na."userId") FROM "news_audience" na WHERE na."companyId" = $1 AND na."newsId" = $2)
               ELSE (SELECT array_agg(u."id") FROM "users" u WHERE u."companyId" = $1 AND COALESCE(u."active",true) = true)
          END AS user_ids
      `;
      const base = await this.ds.query(audienceSql, [companyId, newsId]);
      const userIds: string[] = Array.isArray(base?.[0]?.user_ids)
        ? base[0].user_ids.filter(Boolean)
        : [];
      if (!userIds.length) {
        return { ok: true, accepted: 0, reason: 'empty audience' };
      }

      let targets = userIds;
      if (onlyNotOpened) {
        const ev = await this.schema.detectEventMap();
        if (ev) {
          const opened = await this.ds.query(
            `SELECT DISTINCT "userId"
             FROM ${ev.table}
             WHERE "companyId"=$1 AND "${ev.newsIdCol}"=$2 AND ${ev.typeCol} IN ('OPEN','open','ACK','ack')`,
            [companyId, newsId],
          );
          const openedSet = new Set(
            (opened || []).map((r: any) => String(r.userId)),
          );
          targets = userIds.filter((id) => !openedSet.has(String(id)));
        }
      }

      if (!targets.length) {
        return {
          ok: true,
          accepted: 0,
          reason: 'no targets after OPEN/ACK filter',
        };
      }

      try {
        const values = targets
          .map(
            (_, idx) =>
              `($1,$2,$${idx + 3},'NEWS_REMIND', jsonb_build_object('by',$${targets.length + 3}), now())`,
          )
          .join(',');
        const params = [companyId, newsId, ...targets, actorUserId];

        await this.ds.query(
          `INSERT INTO "push_queue" ("companyId","newsId","userId","kind","meta","createdAt")
           VALUES ${values}
           ON CONFLICT DO NOTHING`,
          params,
        );

        return { ok: true, accepted: targets.length, queued: true };
      } catch {
        return {
          ok: true,
          accepted: targets.length,
          queued: false,
          note: 'table push_queue missing (no-op)',
        };
      }
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }
}
