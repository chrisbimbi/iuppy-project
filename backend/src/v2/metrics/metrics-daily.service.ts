import { Injectable, Logger } from '@nestjs/common'
import { DataSource } from 'typeorm'

type InteractionKind = 'OPEN' | 'ACK' | 'REACT' | 'COMMENT' | 'SHARE'

@Injectable()
export class MetricsDailyServiceV2 {
    private readonly logger = new Logger(MetricsDailyServiceV2.name)
    constructor(private readonly ds: DataSource) { }

    private async hasTable(table: string): Promise<boolean> {
        const r = await this.ds.query(`SELECT to_regclass($1) IS NOT NULL AS t`, [`public.${table}`])
        return !!r?.[0]?.t
    }

    private day(date: Date) {
        return date.toISOString().slice(0, 10) // YYYY-MM-DD
    }

    /** Upsert em news_metrics_daily e user_metrics_daily (contagens do dia) */
    async onEvent(companyId: string, newsId: string, userId: string, kind: InteractionKind, at = new Date()): Promise<void> {
        const d = this.day(at)

        // news_metrics_daily
        if (await this.hasTable('news_metrics_daily')) {
            // garanta linha
            await this.ds.query(
                `INSERT INTO news_metrics_daily ("newsId","date")
         VALUES ($1,$2)
         ON CONFLICT ("newsId","date") DO NOTHING`,
                [newsId, d],
            )

            const col =
                kind === 'OPEN' ? 'opens'
                    : kind === 'ACK' ? 'acks'
                        : kind === 'REACT' ? 'reactions'
                            : kind === 'COMMENT' ? 'comments'
                                : 'shares'

            await this.ds.query(
                `UPDATE news_metrics_daily
         SET "${col}" = COALESCE("${col}",0) + 1
         WHERE "newsId" = $1 AND "date" = $2`,
                [newsId, d],
            )
        }

        // user_metrics_daily
        if (await this.hasTable('user_metrics_daily')) {
            await this.ds.query(
                `INSERT INTO user_metrics_daily ("userId","date")
         VALUES ($1,$2)
         ON CONFLICT ("userId","date") DO NOTHING`,
                [userId, d],
            )

            const col =
                kind === 'OPEN' ? 'opens'
                    : kind === 'ACK' ? 'acks'
                        : kind === 'REACT' ? 'reactions'
                            : kind === 'COMMENT' ? 'comments'
                                : 'shares'

            await this.ds.query(
                `UPDATE user_metrics_daily
         SET "${col}" = COALESCE("${col}",0) + 1
         WHERE "userId" = $1 AND "date" = $2`,
                [userId, d],
            )
        }
    }
}
