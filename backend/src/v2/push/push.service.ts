import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PushV2Service {
    constructor(private readonly ds: DataSource) { }

    private async ensureNews(companyId: string, newsId: string) {
        const n = await this.ds.query(
            `SELECT "id","companyId","title" FROM "news" WHERE "id" = $1 LIMIT 1`,
            [newsId],
        );
        if (!n.length || n[0].companyId !== companyId) {
            throw new ForbiddenException('News not accessible for this company');
        }
        return n[0];
    }

    async enqueueRemind(companyId: string, newsId: string, actorUserId: string, onlyNotOpened: boolean) {
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
            const userIds: string[] = Array.isArray(base?.[0]?.user_ids) ? base[0].user_ids.filter(Boolean) : [];

            if (!userIds.length) {
                return { ok: true, accepted: 0, reason: 'empty audience' };
            }

            let targets = userIds;

            if (onlyNotOpened) {
                const openedRows = await this.ds.query(
                    `SELECT DISTINCT e."userId"
             FROM "news_interaction_event" e
            WHERE e."companyId" = $1
              AND e."newsId"    = $2
              AND e."type" IN ('OPEN','ACK')`,
                    [companyId, newsId],
                );
                const openedSet = new Set(openedRows.map((r: any) => String(r.userId)));
                targets = userIds.filter((id) => !openedSet.has(String(id)));
            }

            if (!targets.length) {
                return { ok: true, accepted: 0, reason: 'no targets after OPEN/ACK filter' };
            }

            try {
                const values = targets
                    .map((_, idx) => `($1,$2,$${idx + 3},'NEWS_REMIND', jsonb_build_object('by', $${targets.length + 3}), now())`)
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
                return { ok: true, accepted: targets.length, queued: false, note: 'table push_queue missing (no-op)' };
            }
        } catch (e) {
            return { ok: false, error: (e as Error).message };
        }
    }
}