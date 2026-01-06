import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

type InteractionKind = 'OPEN' | 'ACK' | 'REACT' | 'COMMENT' | 'SHARE' | 'FAVORITE';

@Injectable()
export class MetricsDailyServiceV2 {
  private readonly logger = new Logger(MetricsDailyServiceV2.name);
  constructor(private readonly ds: DataSource) { }

  private async hasTable(table: string): Promise<boolean> {
    const r = await this.ds.query(`SELECT to_regclass($1) IS NOT NULL AS t`, [
      `public.${table}`,
    ]);
    return !!r?.[0]?.t;
  }

  private day(date: Date) {
    return date.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  /** Confere quantos OPENs esse usuário já tem para essa notícia nesse dia (após inserir o evento) */
  private async countUserOpensForNewsOnDay(
    companyId: string,
    newsId: string,
    userId: string,
    day: string,
  ): Promise<number> {
    if (!userId) return 0;
    if (!(await this.hasTable('news_interaction_event'))) return 0;
    const r = await this.ds.query(
      `
        SELECT COUNT(*)::int AS c
        FROM news_interaction_event
        WHERE "companyId" = $1
          AND "newsId"   = $2
          AND "userId"   = $3
          AND type       = 'OPEN'
          AND "createdAt"::date = $4
      `,
      [companyId, newsId, userId, day],
    );
    return r?.[0]?.c ?? 0;
  }

  /** Upsert em news_metrics_daily e user_metrics_daily (contagens do dia) */
  /** Upsert em news_metrics_daily e user_metrics_daily (contagens do dia) */
  async onEvent(
    companyId: string, // ⬅️ O companyId está aqui e precisa ser usado
    newsId: string,
    userId: string,
    kind: InteractionKind,
    at = new Date(),
  ): Promise<void> {
    const d = this.day(at);

    // ========= NEWS METRICS =========
    if (await this.hasTable('news_metrics_daily')) {
      // garante linha do dia
      await this.ds.query(
        // ATENÇÃO: Adicionado "companyId" na inserção e no CONFLICT
        `INSERT INTO news_metrics_daily ("companyId","newsId","date")
         VALUES ($1,$2,$3)
         ON CONFLICT ("companyId","newsId","date") DO NOTHING`, // ⬅️ Usar ON CONFLICT com companyId
        [companyId, newsId, d], // ⬅️ Adicionado companyId
      );

      if (kind === 'OPEN') {
        // abre total
        await this.ds.query(
          `UPDATE news_metrics_daily
           SET "opens" = COALESCE("opens",0) + 1
           WHERE "companyId" = $1 AND "newsId" = $2 AND "date" = $3`, // ⬅️ Adicionado companyId na cláusula WHERE
          [companyId, newsId, d], // ⬅️ Adicionado companyId
        );

        // se tiver userId, avalia uniqueOpens (primeiro open do dia p/ essa news)
        if (userId) {
          const c = await this.countUserOpensForNewsOnDay(
            companyId,
            newsId,
            userId,
            d,
          );
          if (c === 1) {
            await this.ds.query(
              `UPDATE news_metrics_daily
               SET "uniqueOpens" = COALESCE("uniqueOpens",0) + 1
               WHERE "companyId" = $1 AND "newsId" = $2 AND "date" = $3`, // ⬅️ Adicionado companyId na cláusula WHERE
              [companyId, newsId, d], // ⬅️ Adicionado companyId
            );
          }
        }
      } else {
        const col =
          kind === 'ACK'
            ? 'acks'
            : kind === 'REACT'
              ? 'reactions'
              : kind === 'COMMENT'
                ? 'comments'
                : kind === 'SHARE'
                  ? 'shares'
                  : 'favorites';

        await this.ds.query(
          `UPDATE news_metrics_daily
           SET "${col}" = COALESCE("${col}",0) + 1
           WHERE "companyId" = $1 AND "newsId" = $2 AND "date" = $3`, // ⬅️ Adicionado companyId na cláusula WHERE
          [companyId, newsId, d], // ⬅️ Adicionado companyId
        );
      }
    }

    // ========= USER METRICS =========
    if (userId && (await this.hasTable('user_metrics_daily'))) {
      // garante linha do dia
      await this.ds.query(
        `INSERT INTO user_metrics_daily ("userId","date")
         VALUES ($1,$2)
         ON CONFLICT ("userId","date") DO NOTHING`,
        [userId, d],
      );

      if (kind === 'OPEN') {
        // 🔴 coluna correta no user_metrics_daily é newsOpens
        await this.ds.query(
          `UPDATE user_metrics_daily
           SET "newsOpens" = COALESCE("newsOpens",0) + 1
           WHERE "userId" = $1 AND "date" = $2`,
          [userId, d],
        );

        // unique para o usuário: quantas notícias distintas ele abriu no dia
        const c = await this.countUserOpensForNewsOnDay(
          companyId,
          newsId,
          userId,
          d,
        );
        if (c === 1) {
          await this.ds.query(
            `UPDATE user_metrics_daily
             SET "newsUniqueOpens" = COALESCE("newsUniqueOpens",0) + 1
             WHERE "userId" = $1 AND "date" = $2`,
            [userId, d],
          );
        }
      } else if (kind === 'REACT' || kind === 'COMMENT' || kind === 'SHARE' || kind === 'FAVORITE') {
        const col =
          kind === 'REACT'
            ? 'reactions'
            : kind === 'COMMENT'
              ? 'comments'
              : kind === 'SHARE'
                ? 'shares'
                : 'favorites';
        await this.ds.query(
          `UPDATE user_metrics_daily
           SET "${col}" = COALESCE("${col}",0) + 1
           WHERE "userId" = $1 AND "date" = $2`,
          [userId, d],
        );
      } else {
        // ACK: não há coluna correspondente no user_metrics_daily — não faz nada
      }
    }
  }
  async trackFavorite(
    companyId: string,
    newsId: string,
    userId: string,
    favorited: boolean, // true = favorited, false = unfavorited
    at = new Date(),
  ): Promise<void> {
    // Registra o evento de interação (apenas se favorited=true)
    if (favorited) {
      await this.onEvent(companyId, newsId, userId, 'FAVORITE', at);
    }

    const d = this.day(at);
    const inc = favorited ? 1 : -1;

    // ========= NEWS METRICS =========
    if (await this.hasTable('news_metrics_daily')) {
      await this.ds.query(
        `INSERT INTO news_metrics_daily ("companyId","newsId","date")
         VALUES ($1,$2,$3)
         ON CONFLICT ("companyId","newsId","date") DO NOTHING`,
        [companyId, newsId, d],
      );

      await this.ds.query(
        `UPDATE news_metrics_daily
         SET "favorites" = GREATEST(0, COALESCE("favorites",0) + $4)
         WHERE "companyId" = $1 AND "newsId" = $2 AND "date" = $3`,
        [companyId, newsId, d, inc],
      );
    }

    // ========= USER METRICS =========
    if (userId && (await this.hasTable('user_metrics_daily'))) {
      await this.ds.query(
        `INSERT INTO user_metrics_daily ("userId","date")
         VALUES ($1,$2)
         ON CONFLICT ("userId","date") DO NOTHING`,
        [userId, d],
      );

      await this.ds.query(
        `UPDATE user_metrics_daily
         SET "favorites" = GREATEST(0, COALESCE("favorites",0) + $3)
         WHERE "userId" = $1 AND "date" = $2`,
        [userId, d, inc],
      );
    }
  }
}
