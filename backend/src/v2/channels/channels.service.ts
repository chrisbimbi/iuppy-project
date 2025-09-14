import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

async function regclass(ds: DataSource, name: string) {
  const r = await ds.query(`SELECT to_regclass($1) AS t`, [name]);
  return !!r?.[0]?.t;
}

async function columnExists(ds: DataSource, table: string, column: string) {
  const r = await ds.query(
    `SELECT 1
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
      LIMIT 1`,
    [table, column],
  );
  return r.length > 0;
}

async function pickColumn(ds: DataSource, table: string, candidates: string[]) {
  for (const c of candidates) {
    if (await columnExists(ds, table, c)) return c;
  }
  return null;
}

async function countRows(ds: DataSource, table: string, companyCol: string | null, companyId: string) {
  if (companyCol) {
    const r = await ds.query(
      `SELECT 1 FROM "${table}" WHERE "${companyCol}" = $1 LIMIT 1`,
      [companyId],
    );
    return r.length;
  }
  const r = await ds.query(`SELECT 1 FROM "${table}" LIMIT 1`);
  return r.length;
}

async function pickChannelsTable(ds: DataSource, companyId: string) {
  const candidates = ['channel', 'channels', 'channel_entity'];
  const existing: string[] = [];
  for (const t of candidates) {
    if (await regclass(ds, `public.${t}`)) existing.push(t);
  }
  if (existing.length === 0) return null;

  let best: { table: string; rows: number; companyCol: string | null } | null = null;
  for (const t of existing) {
    const companyCol =
      (await pickColumn(ds, t, ['companyId', 'company_id'])) || null;
    const rows = await countRows(ds, t, companyCol, companyId);
    if (!best || rows > best.rows) {
      best = { table: t, rows, companyCol };
    }
  }
  return best;
}

@Injectable()
export class ChannelsV2Service {
  constructor(private readonly ds: DataSource) { }

  async listVisibleChannels(companyId: string, userId: string, spaceId?: string) {
    const picked = await pickChannelsTable(this.ds, companyId);
    if (!picked) return [];

    const table = picked.table;
    const companyCol = picked.companyCol || 'companyId';

    const nameCol = (await pickColumn(this.ds, table, ['name'])) || 'name';
    const slugCol = await pickColumn(this.ds, table, ['slug']);
    const positionCol = await pickColumn(this.ds, table, ['position']);
    const statusCol =
      (await pickColumn(this.ds, table, ['active', 'isPublished', 'published', 'is_active', 'is_published'])) || null;

    const spaceIdCol =
      (await pickColumn(this.ds, table, ['spaceId', 'space_id'])) || null;
    const spaceIdsCol =
      (await pickColumn(this.ds, table, ['spaceIds', 'space_ids'])) || null;

    const hasChannelSpace = await regclass(this.ds, 'public.channel_space');
    const hasSpaceChannel = await regclass(this.ds, 'public.space_channel');
    const pivot = hasChannelSpace ? 'channel_space' : hasSpaceChannel ? 'space_channel' : null;

    // user_channel gating (apenas se houver linhas para o usuário)
    const hasUserChannel = await regclass(this.ds, 'public.user_channel');
    let gateByUser = false;
    let ucCompanyCol = 'companyId';
    let ucUserCol = 'userId';
    let ucChannelCol = 'channelId';

    if (hasUserChannel) {
      ucCompanyCol = (await pickColumn(this.ds, 'user_channel', ['companyId', 'company_id'])) || 'companyId';
      ucUserCol = (await pickColumn(this.ds, 'user_channel', ['userId', 'user_id'])) || 'userId';
      ucChannelCol = (await pickColumn(this.ds, 'user_channel', ['channelId', 'channel_id'])) || 'channelId';

      const r = await this.ds.query(
        `SELECT 1 FROM "user_channel" WHERE "${ucCompanyCol}" = $1 AND "${ucUserCol}" = $2 LIMIT 1`,
        [companyId, userId],
      );
      gateByUser = r.length > 0;
    }

    const selectParts = [
      `c."id"`,
      spaceIdCol ? `c."${spaceIdCol}" AS "spaceId"` : `NULL::uuid AS "spaceId"`,
      `c."${nameCol}" AS "name"`,
      slugCol
        ? `c."${slugCol}" AS "slug"`
        : `LOWER(regexp_replace(c."${nameCol}", '[^a-zA-Z0-9]+', '-', 'g')) AS "slug"`,
      positionCol ? `c."${positionCol}" AS "position"` : `NULL::int AS "position"`,
    ];

    const filters: string[] = [`c."${companyCol}" = $1`];
    const params: any[] = [companyId];

    if (statusCol) {
      filters.push(`COALESCE(c."${statusCol}", true) = true`);
    }

    // --- Filtro por spaceId (corrigido para text[]/uuid[]/jsonb) ---
    if (spaceId) {
      if (spaceIdCol) {
        filters.push(`c."${spaceIdCol}" = $${params.length + 1}`);
        params.push(spaceId);
      } else if (spaceIdsCol) {
        // Descobre o tipo do array/coluna
        const t = await this.ds.query(
          `SELECT data_type, udt_name
             FROM information_schema.columns
            WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
          [table, spaceIdsCol],
        );
        const udt = t?.[0]?.udt_name as string | undefined; // ex: _uuid, _text, _varchar
        const isArray = (t?.[0]?.data_type === 'ARRAY') || (udt?.startsWith('_'));

        if (isArray) {
          if (udt === '_uuid') {
            filters.push(`$${params.length + 1}::uuid = ANY(c."${spaceIdsCol}")`);
            params.push(spaceId);
          } else {
            // text[] / varchar[] / etc.
            filters.push(`$${params.length + 1}::text = ANY(c."${spaceIdsCol}")`);
            params.push(spaceId);
          }
        } else {
          // JSON/JSONB
          filters.push(`c."${spaceIdsCol}"::jsonb @> $${params.length + 1}::jsonb`);
          params.push(JSON.stringify([spaceId]));
        }
      } else if (pivot) {
        // Algumas pivots não têm companyId; se não tiver, removemos a comparação
        const pivotHasCompany = await columnExists(this.ds, pivot, companyCol);
        const companyPredicate = pivotHasCompany
          ? `m."${companyCol}" = c."${companyCol}" AND`
          : '';

        filters.push(`
          EXISTS (
            SELECT 1 FROM "${pivot}" m
             WHERE ${companyPredicate}
                   m."channelId" = c."id"
               AND m."spaceId" = $${params.length + 1}
          )
        `);
        params.push(spaceId);
      }
    }
    // --- fim do filtro por spaceId ---

    if (gateByUser) {
      filters.push(`
        EXISTS (
          SELECT 1 FROM "user_channel" uc
           WHERE uc."${ucCompanyCol}" = c."${companyCol}"
             AND uc."${ucChannelCol}" = c."id"
             AND uc."${ucUserCol}" = $${params.length + 1}
        )
      `);
      params.push(userId);
    }

    const sql = `
      SELECT ${selectParts.join(', ')}
        FROM "${table}" c
       WHERE ${filters.join(' AND ')}
       ORDER BY "position" NULLS LAST, "name" ASC
    `;

    return this.ds.query(sql, params);
  }
}