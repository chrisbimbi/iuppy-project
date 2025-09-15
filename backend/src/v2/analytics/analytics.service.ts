import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

async function pickFirstExisting(ds: DataSource, names: string[]) {
  for (const n of names) {
    const r = await ds.query(`SELECT to_regclass($1) AS t`, [n]);
    if (r?.[0]?.t) return n.replace('public.', '');
  }
  return null;
}
async function colExists(ds: DataSource, table: string, col: string) {
  const r = await ds.query(
    `SELECT 1
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
      LIMIT 1`,
    [table, col],
  );
  return r.length > 0;
}
function parseRange(from?: string, to?: string) {
  const start = from ? new Date(from) : new Date('1970-01-01');
  const end = to ? new Date(to) : new Date('2100-01-01');
  return [start.toISOString(), end.toISOString()];
}

@Injectable()
export class AnalyticsV2Service {
  constructor(private readonly ds: DataSource) {}

  async newsMetrics(companyId: string, newsId: string, from?: string, to?: string) {
    const [fromIso, toIso] = parseRange(from, to);

    const eventsTable = await pickFirstExisting(this.ds, [
      'public.news_interaction_event',   // ← sua tabela principal
      'public.interaction_event_entity',
      'public.interaction_event',
    ]);
    const reactionsTable = await pickFirstExisting(this.ds, [
      'public.news_reaction',
      'public.news_reaction_entity',
    ]);
    const commentsTable = await pickFirstExisting(this.ds, [
      'public.news_comment',
      'public.news_comment_entity',
    ]);
    const sharesTable = await pickFirstExisting(this.ds, [
      'public.news_share',
      'public.news_share_entity',
    ]);

    const eventTypeCol =
      eventsTable && (await colExists(this.ds, eventsTable, 'type')) ? `"type"` : `"event"`;

    // UPPER para casar com InteractionsService
    const OPEN = 'OPEN';
    const ACK  = 'ACK';
    const SHARE = 'SHARE';

    let totalOpens = 0;
    let uniqueOpens = 0;
    let acknowledgements = 0;

    if (eventsTable) {
      const total = await this.ds.query(
        `SELECT COUNT(*)::int AS c
           FROM "${eventsTable}" e
          WHERE e."companyId" = $1 AND e."newsId" = $2
            AND e.${eventTypeCol} = '${OPEN}'
            AND e."createdAt" BETWEEN $3 AND $4`,
        [companyId, newsId, fromIso, toIso],
      );
      totalOpens = total?.[0]?.c ?? 0;

      const uniq = await this.ds.query(
        `SELECT COUNT(DISTINCT e."userId")::int AS c
           FROM "${eventsTable}" e
          WHERE e."companyId" = $1 AND e."newsId" = $2
            AND e.${eventTypeCol} = '${OPEN}'
            AND e."createdAt" BETWEEN $3 AND $4`,
        [companyId, newsId, fromIso, toIso],
      );
      uniqueOpens = uniq?.[0]?.c ?? 0;

      const acks = await this.ds.query(
        `SELECT COUNT(*)::int AS c
           FROM "${eventsTable}" e
          WHERE e."companyId" = $1 AND e."newsId" = $2
            AND e.${eventTypeCol} = '${ACK}'
            AND e."createdAt" BETWEEN $3 AND $4`,
        [companyId, newsId, fromIso, toIso],
      );
      acknowledgements = acks?.[0]?.c ?? 0;
    }

    let comments = 0;
    if (commentsTable) {
      const r = await this.ds.query(
        `SELECT COUNT(*)::int AS c
           FROM "${commentsTable}" c
          WHERE c."companyId" = $1 AND c."newsId" = $2
            AND c."createdAt" BETWEEN $3 AND $4`,
        [companyId, newsId, fromIso, toIso],
      );
      comments = r?.[0]?.c ?? 0;
    }

    let shares = 0;
    if (sharesTable) {
      const r = await this.ds.query(
        `SELECT COUNT(*)::int AS c
           FROM "${sharesTable}" s
          WHERE s."companyId" = $1 AND s."newsId" = $2
            AND s."createdAt" BETWEEN $3 AND $4`,
        [companyId, newsId, fromIso, toIso],
      );
      shares = r?.[0]?.c ?? 0;
    } else if (eventsTable) {
      const r = await this.ds.query(
        `SELECT COUNT(*)::int AS c
           FROM "${eventsTable}" e
          WHERE e."companyId" = $1 AND e."newsId" = $2
            AND e.${eventTypeCol} = '${SHARE}'
            AND e."createdAt" BETWEEN $3 AND $4`,
        [companyId, newsId, fromIso, toIso],
      );
      shares = r?.[0]?.c ?? 0;
    }

    const reactions: Record<string, number> = {};
    if (reactionsTable) {
      const reactionTypeCol =
        (await colExists(this.ds, reactionsTable, 'reaction')) ? `"reaction"`
        : (await colExists(this.ds, reactionsTable, 'type')) ? `"type"`
        : `"reaction"`;

      const rows = await this.ds.query(
        `SELECT ${reactionTypeCol} AS t, COUNT(*)::int AS c
           FROM "${reactionsTable}" r
          WHERE r."companyId" = $1 AND r."newsId" = $2
            AND r."createdAt" BETWEEN $3 AND $4
          GROUP BY ${reactionTypeCol}`,
        [companyId, newsId, fromIso, toIso],
      );
      for (const row of rows) reactions[row.t] = row.c;
    }

    return {
      totalOpens,
      uniqueOpens,
      acknowledgements,
      reactions,
      comments,
      shares,
      from: fromIso,
      to: toIso,
    };
  }

  async overview(companyId: string, from?: string, to?: string) {
    const [fromIso, toIso] = parseRange(from, to);

    const eventsTable = await pickFirstExisting(this.ds, [
      'public.news_interaction_event',
      'public.interaction_event_entity',
      'public.interaction_event',
    ]);
    const reactionsTable = await pickFirstExisting(this.ds, [
      'public.news_reaction',
      'public.news_reaction_entity',
    ]);
    const commentsTable = await pickFirstExisting(this.ds, [
      'public.news_comment',
      'public.news_comment_entity',
    ]);
    const sharesTable = await pickFirstExisting(this.ds, [
      'public.news_share',
      'public.news_share_entity',
    ]);

    const eventTypeCol =
      eventsTable && (await colExists(this.ds, eventsTable, 'type')) ? `"type"` : `"event"`;

    const OPEN = 'OPEN';
    const ACK  = 'ACK';
    const SHARE = 'SHARE';

    let totalOpens = 0;
    let uniqueOpens = 0;
    let acknowledgements = 0;

    if (eventsTable) {
      totalOpens =
        (await this.ds.query(
          `SELECT COUNT(*)::int AS c
             FROM "${eventsTable}" e
            WHERE e."companyId" = $1
              AND e.${eventTypeCol} = '${OPEN}'
              AND e."createdAt" BETWEEN $2 AND $3`,
          [companyId, fromIso, toIso],
        ))?.[0]?.c ?? 0;

      uniqueOpens =
        (await this.ds.query(
          `SELECT COUNT(DISTINCT e."userId")::int AS c
             FROM "${eventsTable}" e
            WHERE e."companyId" = $1
              AND e.${eventTypeCol} = '${OPEN}'
              AND e."createdAt" BETWEEN $2 AND $3`,
          [companyId, fromIso, toIso],
        ))?.[0]?.c ?? 0;

      acknowledgements =
        (await this.ds.query(
          `SELECT COUNT(*)::int AS c
             FROM "${eventsTable}" e
            WHERE e."companyId" = $1
              AND e.${eventTypeCol} = '${ACK}'
              AND e."createdAt" BETWEEN $2 AND $3`,
          [companyId, fromIso, toIso],
        ))?.[0]?.c ?? 0;
    }

    let comments = 0;
    if (commentsTable) {
      comments =
        (await this.ds.query(
          `SELECT COUNT(*)::int AS c
             FROM "${commentsTable}" c
            WHERE c."companyId" = $1
              AND c."createdAt" BETWEEN $2 AND $3`,
          [companyId, fromIso, toIso],
        ))?.[0]?.c ?? 0;
    }

    let shares = 0;
    if (sharesTable) {
      shares =
        (await this.ds.query(
          `SELECT COUNT(*)::int AS c
             FROM "${sharesTable}" s
            WHERE s."companyId" = $1
              AND s."createdAt" BETWEEN $2 AND $3`,
          [companyId, fromIso, toIso],
        ))?.[0]?.c ?? 0;
    } else if (eventsTable) {
      shares =
        (await this.ds.query(
          `SELECT COUNT(*)::int AS c
             FROM "${eventsTable}" e
            WHERE e."companyId" = $1
              AND e.${eventTypeCol} = '${SHARE}'
              AND e."createdAt" BETWEEN $2 AND $3`,
          [companyId, fromIso, toIso],
        ))?.[0]?.c ?? 0;
    }

    const reactions: Record<string, number> = {};
    if (reactionsTable) {
      const reactionTypeCol =
        (await colExists(this.ds, reactionsTable, 'reaction')) ? `"reaction"`
        : (await colExists(this.ds, reactionsTable, 'type')) ? `"type"`
        : `"reaction"`;

      const rows = await this.ds.query(
        `SELECT ${reactionTypeCol} AS t, COUNT(*)::int AS c
           FROM "${reactionsTable}" r
          WHERE r."companyId" = $1
            AND r."createdAt" BETWEEN $2 AND $3
          GROUP BY ${reactionTypeCol}`,
        [companyId, fromIso, toIso],
      );
      for (const row of rows) reactions[row.t] = row.c;
    }

    return {
      totalOpens,
      uniqueOpens,
      acknowledgements,
      reactions,
      comments,
      shares,
      from: fromIso,
      to: toIso,
    };
  }
}