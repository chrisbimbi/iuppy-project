import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Utilitários (iguais ao seu estilo atual).
 */
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
async function countRows(
  ds: DataSource,
  table: string,
  companyCol: string | null,
  companyId: string,
) {
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

  let best: { table: string; rows: number; companyCol: string | null } | null =
    null;
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
async function hasAnyNotNull(ds: DataSource, table: string, col: string) {
  const r = await ds.query(
    `SELECT 1 FROM "${table}" WHERE "${col}" IS NOT NULL LIMIT 1`,
  );
  return r.length > 0;
}

/**
 * Resposta compacta para a UI (id, spaceId, name, slug, position).
 */
type ChannelListRow = {
  id: string;
  spaceId: string | null;
  name: string;
  slug: string;
  position: number | null;
};

@Injectable()
export class ChannelsV2Service {
  constructor(private readonly ds: DataSource) { }

  /**
   * Lista canais visíveis ao usuário (com segmentação) e **sempre** refletindo o space.
   *
   * Regras:
   * - Se existir coluna ARRAY (space_ids: uuid[]|text[]) → explode 1 linha por (channel×spaceId)
   * - Senão, se existir pivô channel_space/space_channel → 1 linha por (channel×spaceId)
   * - Senão, usar coluna simples spaceId/space_id (1 linha)
   * - Gating por user_channel quando houver linhas para o usuário.
   */
  async listVisibleChannels(
    companyId: string,
    userId: string,
    spaceId?: string,
  ): Promise<ChannelListRow[]> {
    const picked = await pickChannelsTable(this.ds, companyId);
    if (!picked) return [];

    const table = picked.table;
    const companyCol = picked.companyCol || 'companyId';

    const nameCol = (await pickColumn(this.ds, table, ['name'])) || 'name';
    const slugCol = await pickColumn(this.ds, table, ['slug']);
    const positionCol = await pickColumn(this.ds, table, ['position']);
    const statusCol =
      (await pickColumn(this.ds, table, [
        'active',
        'isPublished',
        'published',
        'is_active',
        'is_published',
      ])) || null;

    const spaceIdCol =
      (await pickColumn(this.ds, table, ['spaceId', 'space_id'])) || null;
    const spaceIdsCol =
      (await pickColumn(this.ds, table, ['spaceIds', 'space_ids'])) || null;

    // pivôs possíveis
    const hasChannelSpace = await regclass(this.ds, 'public.channel_space');
    const hasSpaceChannel = await regclass(this.ds, 'public.space_channel');
    const pivot = hasChannelSpace
      ? 'channel_space'
      : hasSpaceChannel
        ? 'space_channel'
        : null;

    // user_channel gating
    const hasUserChannel = await regclass(this.ds, 'public.user_channel');
    let gateByUser = false;
    let ucCompanyCol = 'companyId';
    let ucUserCol = 'userId';
    let ucChannelCol = 'channelId';

    if (hasUserChannel) {
      ucCompanyCol =
        (await pickColumn(this.ds, 'user_channel', [
          'companyId',
          'company_id',
        ])) || 'companyId';
      ucUserCol =
        (await pickColumn(this.ds, 'user_channel', ['userId', 'user_id'])) ||
        'userId';
      ucChannelCol =
        (await pickColumn(this.ds, 'user_channel', [
          'channelId',
          'channel_id',
        ])) || 'channelId';
      const r = await this.ds.query(
        `SELECT 1 FROM "user_channel" WHERE "${ucCompanyCol}" = $1 AND "${ucUserCol}" = $2 LIMIT 1`,
        [companyId, userId],
      );
      gateByUser = r.length > 0;
    }

    // Descobrir se vale usar space_ids (ARRAY) como fonte principal
    let useArray = false;
    let arrayIsUUID = false;
    if (spaceIdsCol) {
      const t = await this.ds.query(
        `SELECT data_type, udt_name
           FROM information_schema.columns
          WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
        [table, spaceIdsCol],
      );
      const udt = t?.[0]?.udt_name as string | undefined; // _uuid, _text, _varchar
      const isArray =
        t?.[0]?.data_type === 'ARRAY' || (udt && udt.startsWith('_'));
      if (isArray && (await hasAnyNotNull(this.ds, table, spaceIdsCol))) {
        useArray = true;
        arrayIsUUID = udt === '_uuid';
      }
    }

    // Ordem de preferência da fonte de space:
    // 1) ARRAY (space_ids), 2) pivô, 3) coluna simples (spaceId)
    const source: 'array' | 'pivot' | 'single' | null = useArray
      ? 'array'
      : pivot
        ? 'pivot'
        : spaceIdCol
          ? 'single'
          : null;

    if (!source) {
      // Sem qualquer referência a space (bem raro) — retorna sem spaceId.
      const sql = `
        SELECT c."id",
               NULL::uuid AS "spaceId",
               c."${nameCol}" AS "name",
               ${slugCol
          ? `c."${slugCol}"`
          : `LOWER(regexp_replace(c."${nameCol}", '[^a-zA-Z0-9]+', '-', 'g'))`
        } AS "slug",
               ${positionCol ? `c."${positionCol}"` : 'NULL::int'} AS "position"
          FROM "${table}" c
         WHERE c."${companyCol}" = $1
           ${statusCol ? `AND COALESCE(c."${statusCol}", true) = true` : ''}
           ${gateByUser
          ? `AND EXISTS (SELECT 1 FROM "user_channel" uc
                               WHERE uc."${ucCompanyCol}" = c."${companyCol}"
                                 AND uc."${ucChannelCol}" = c."id"
                                 AND uc."${ucUserCol}" = $2)`
          : ''
        }
         ORDER BY "position" NULLS LAST, "name" ASC
      `;
      const params = gateByUser ? [companyId, userId] : [companyId];
      return this.ds.query(sql, params);
    }

    if (source === 'single') {
      // Coluna simples spaceId/space_id (1 linha por canal)
      const filters: string[] = [`c."${companyCol}" = $1`];
      const params: any[] = [companyId];
      if (statusCol) filters.push(`COALESCE(c."${statusCol}", true) = true`);
      if (spaceId) {
        filters.push(`c."${spaceIdCol}" = $${params.length + 1}`);
        params.push(spaceId);
      }
      if (gateByUser) {
        filters.push(`
          EXISTS (SELECT 1 FROM "user_channel" uc
                   WHERE uc."${ucCompanyCol}" = c."${companyCol}"
                     AND uc."${ucChannelCol}" = c."id"
                     AND uc."${ucUserCol}" = $${params.length + 1})
        `);
        params.push(userId);
      }
      const sql = `
        SELECT c."id",
               c."${spaceIdCol}" AS "spaceId",
               c."${nameCol}" AS "name",
               ${slugCol
          ? `c."${slugCol}"`
          : `LOWER(regexp_replace(c."${nameCol}", '[^a-zA-Z0-9]+', '-', 'g'))`
        } AS "slug",
               ${positionCol ? `c."${positionCol}"` : 'NULL::int'} AS "position"
          FROM "${table}" c
         WHERE ${filters.join(' AND ')}
         ORDER BY "position" NULLS LAST, "name" ASC
      `;
      return this.ds.query(sql, params);
    }

    if (source === 'array') {
      // ARRAY space_ids (uuid[]|text[]) → explode por spaceId
      // Usamos LATERAL para obter 1 linha por space
      const filters: string[] = [`c."${companyCol}" = $1`];
      const params: any[] = [companyId];
      if (statusCol) filters.push(`COALESCE(c."${statusCol}", true) = true`);

      let lateralExpr = arrayIsUUID
        ? `unnest(c."${spaceIdsCol}")::uuid`
        : `unnest(c."${spaceIdsCol}")::text::uuid`; // converte text->uuid

      if (spaceId) {
        // filtra no lateral
        lateralExpr = arrayIsUUID
          ? ` (SELECT x FROM unnest(c."${spaceIdsCol}") AS x WHERE x = $${params.length + 1
          }::uuid) AS sub `
          : ` (SELECT x FROM unnest(c."${spaceIdsCol}") AS x WHERE x = $${params.length + 1
          }::text) AS sub `;
        params.push(spaceId);
      }

      if (gateByUser) {
        filters.push(`
          EXISTS (SELECT 1 FROM "user_channel" uc
                   WHERE uc."${ucCompanyCol}" = c."${companyCol}"
                     AND uc."${ucChannelCol}" = c."id"
                     AND uc."${ucUserCol}" = $${params.length + 1})
        `);
        params.push(userId);
      }

      const sql = `
        SELECT c."id",
               s.space_id AS "spaceId",
               c."${nameCol}" AS "name",
               ${slugCol
          ? `c."${slugCol}"`
          : `LOWER(regexp_replace(c."${nameCol}", '[^a-zA-Z0-9]+', '-', 'g'))`
        } AS "slug",
               ${positionCol ? `c."${positionCol}"` : 'NULL::int'} AS "position"
          FROM "${table}" c
          CROSS JOIN LATERAL (
            SELECT ${arrayIsUUID ? 'x::uuid' : 'x::text::uuid'} AS space_id
              FROM ${spaceId ? lateralExpr : `unnest(c."${spaceIdsCol}") AS x`}
          ) s
         WHERE ${filters.join(' AND ')}
         ORDER BY "position" NULLS LAST, "name" ASC
      `;
      return this.ds.query(sql, params);
    }

    // source === 'pivot'
    {
      const filters: string[] = [`c."${companyCol}" = $1`];
      const params: any[] = [companyId];
      if (statusCol) filters.push(`COALESCE(c."${statusCol}", true) = true`);
      if (spaceId) {
        filters.push(`m."spaceId" = $${params.length + 1}`);
        params.push(spaceId);
      }

      // Algumas pivôs podem não ter companyId
      const pivotHasCompany = await columnExists(this.ds, pivot, companyCol);
      const companyJoin = pivotHasCompany
        ? `AND m."${companyCol}" = c."${companyCol}"`
        : '';

      if (gateByUser) {
        filters.push(`
          EXISTS (SELECT 1 FROM "user_channel" uc
                   WHERE uc."${ucCompanyCol}" = c."${companyCol}"
                     AND uc."${ucChannelCol}" = c."id"
                     AND uc."${ucUserCol}" = $${params.length + 1})
        `);
        params.push(userId);
      }

      const sql = `
        SELECT c."id",
               m."spaceId" AS "spaceId",
               c."${nameCol}" AS "name",
               ${slugCol
          ? `c."${slugCol}"`
          : `LOWER(regexp_replace(c."${nameCol}", '[^a-zA-Z0-9]+', '-', 'g'))`
        } AS "slug",
               ${positionCol ? `c."${positionCol}"` : 'NULL::int'} AS "position"
          FROM "${table}" c
          JOIN "${pivot}" m
            ON m."channelId" = c."id" ${companyJoin}
         WHERE ${filters.join(' AND ')}
         ORDER BY "position" NULLS LAST, "name" ASC
      `;
      return this.ds.query(sql, params);
    }
  }
}
