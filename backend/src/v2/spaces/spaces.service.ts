import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

type Cols = {
  company: string;          // companyId | company_id
  name: string;             // name
  slug?: string | null;     // slug?
  position?: string | null; // position?
  status?: string | null;   // active | isPublished | published | is_active | is_published
};

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

async function pickSpacesTable(ds: DataSource, companyId: string) {
  // Preferir as que geralmente têm dados: singular antes do plural
  const candidates = ['space', 'spaces', 'space_entity'];
  const existing: string[] = [];
  for (const t of candidates) {
    if (await regclass(ds, `public.${t}`)) existing.push(t);
  }
  if (existing.length === 0) return null;

  // Escolhe a que tiver linhas para a empresa; se nenhuma tiver, pega a que tiver qualquer linha; senão a primeira
  let best: { table: string; rows: number; companyCol: string | null } | null = null;
  for (const t of existing) {
    const companyCol =
      (await pickColumn(ds, t, ['companyId', 'company_id'])) || null;
    const rows = await countRows(ds, t, companyCol, companyId);
    if (!best || rows > best.rows) {
      best = { table: t, rows, companyCol };
    }
  }
  return best; // { table, rows, companyCol }
}

async function hasRowsForUser(ds: DataSource, table: string, cols: { company: string; user: string }) {
  const r = await ds.query(
    `SELECT 1 FROM "${table}" WHERE "${cols.company}" = $1 AND "${cols.user}" = $2 LIMIT 1`,
    // valores serão preenchidos pelo caller com .bind
    [],
  );
  return r.length > 0;
}

@Injectable()
export class SpacesV2Service {
  constructor(private readonly ds: DataSource) {}

  async listVisibleSpaces(companyId: string, userId: string) {
    const picked = await pickSpacesTable(this.ds, companyId);
    if (!picked) return [];

    const table = picked.table;
    const companyCol = picked.companyCol || 'companyId';

    // Descobre colunas
    const nameCol = (await pickColumn(this.ds, table, ['name'])) || 'name';
    const slugCol = await pickColumn(this.ds, table, ['slug']);
    const positionCol = await pickColumn(this.ds, table, ['position']);
    const statusCol =
      (await pickColumn(this.ds, table, ['active', 'isPublished', 'published', 'is_active', 'is_published'])) || null;

    // user_space gating (só se existir tabela + linhas do usuário)
    const hasUserSpace = await regclass(this.ds, 'public.user_space');
    let gateByUser = false;
    let usCompanyCol = 'companyId';
    let usUserCol = 'userId';
    let usSpaceCol = 'spaceId';

    if (hasUserSpace) {
      usCompanyCol = (await pickColumn(this.ds, 'user_space', ['companyId', 'company_id'])) || 'companyId';
      usUserCol = (await pickColumn(this.ds, 'user_space', ['userId', 'user_id'])) || 'userId';
      usSpaceCol = (await pickColumn(this.ds, 'user_space', ['spaceId', 'space_id'])) || 'spaceId';

      const r = await this.ds.query(
        `SELECT 1 FROM "user_space" WHERE "${usCompanyCol}" = $1 AND "${usUserCol}" = $2 LIMIT 1`,
        [companyId, userId],
      );
      gateByUser = r.length > 0;
    }

    const selectParts = [
      `s."id"`,
      `s."${nameCol}" AS "name"`,
      slugCol
        ? `s."${slugCol}" AS "slug"`
        : `LOWER(regexp_replace(s."${nameCol}", '[^a-zA-Z0-9]+', '-', 'g')) AS "slug"`,
      positionCol ? `s."${positionCol}" AS "position"` : `NULL::int AS "position"`,
    ];

    const filters: string[] = [`s."${companyCol}" = $1`];
    const params: any[] = [companyId];

    if (statusCol) {
      filters.push(`COALESCE(s."${statusCol}", true) = true`);
    }

    let sql: string;
    if (gateByUser) {
      sql = `
        SELECT ${selectParts.join(', ')}
          FROM "${table}" s
         WHERE ${filters.join(' AND ')}
           AND EXISTS (
             SELECT 1
               FROM "user_space" us
              WHERE us."${usCompanyCol}" = s."${companyCol}"
                AND us."${usSpaceCol}"   = s."id"
                AND us."${usUserCol}"    = $2
           )
         ORDER BY "position" NULLS LAST, "name" ASC
      `;
      params.push(userId);
    } else {
      sql = `
        SELECT ${selectParts.join(', ')}
          FROM "${table}" s
         WHERE ${filters.join(' AND ')}
         ORDER BY "position" NULLS LAST, "name" ASC
      `;
    }

    return this.ds.query(sql, params);
  }
}