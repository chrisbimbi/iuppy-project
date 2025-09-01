import { MigrationInterface, QueryRunner } from 'typeorm'

export class RefactorModuleAccessGrants1725196800000 implements MigrationInterface {
  name = 'RefactorModuleAccessGrants1725196800000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extensão para gerar UUID (ignora se já existir)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Se já estiver no formato novo, não faz nada
    const hasOldCols: Array<{ exists: boolean }> = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'module_access_grants' AND column_name = 'actions'
      ) AS exists
    `)
    if (!hasOldCols?.[0]?.exists) {
      // garante índice único novo (idempotente)
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname = 'public'
              AND indexname = 'IDX_module_access_grants_unique'
          ) THEN
            CREATE UNIQUE INDEX "IDX_module_access_grants_unique"
            ON "module_access_grants" ("companyId","userId","moduleKey");
          END IF;
        END$$;
      `)
      return
    }

    // --- cria tabela nova com o schema final ---
    await queryRunner.query(`
      CREATE TABLE "module_access_grants_new" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "companyId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "moduleKey" text NOT NULL,
        "scopeType" text NOT NULL DEFAULT 'ALL_SPACES',
        "spaceIds" text[] NOT NULL DEFAULT '{}',
        "canView" boolean NOT NULL DEFAULT false,
        "canEdit" boolean NOT NULL DEFAULT false,
        "canManage" boolean NOT NULL DEFAULT false,
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
    `)

    // --- agrega e migra dados do schema antigo para o novo ---
    await queryRunner.query(`
      INSERT INTO "module_access_grants_new"
        ("companyId","userId","moduleKey","scopeType","spaceIds","canView","canEdit","canManage","updatedAt")
      SELECT
        mag."companyId",
        mag."userId",
        mag."moduleKey",
        CASE
          WHEN BOOL_OR(mag."scope" = 'all') THEN 'ALL_SPACES'
          ELSE 'SPACE_IDS'
        END AS "scopeType",
        CASE
          WHEN BOOL_OR(mag."scope" = 'all') THEN '{}'::text[]
          ELSE ARRAY(
            SELECT DISTINCT s FROM UNNEST(ARRAY_AGG(mag."spaceId")) AS s
          )::text[]
        END AS "spaceIds",
        BOOL_OR( (mag."actions" @> ARRAY['view']::text[]) OR (mag."actions" @> ARRAY['edit']::text[]) ) AS "canView",
        BOOL_OR( mag."actions" @> ARRAY['edit']::text[] ) AS "canEdit",
        FALSE AS "canManage",
        NOW()
      FROM "module_access_grants" mag
      GROUP BY mag."companyId", mag."userId", mag."moduleKey";
    `)

    // substitui a tabela
    await queryRunner.query(`DROP TABLE "module_access_grants";`)
    await queryRunner.query(`ALTER TABLE "module_access_grants_new" RENAME TO "module_access_grants";`)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_module_access_grants_unique"
      ON "module_access_grants" ("companyId","userId","moduleKey");
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // se já está no formato antigo, não faz nada
    const hasNewCols: Array<{ exists: boolean }> = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'module_access_grants' AND column_name = 'scopeType'
      ) AS exists
    `)
    if (!hasNewCols?.[0]?.exists) return

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_module_access_grants_unique";`)

    // recria tabela antiga
    await queryRunner.query(`
      CREATE TABLE "module_access_grants_old" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "companyId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "moduleKey" text NOT NULL,
        "scope" text NOT NULL DEFAULT 'space',
        "spaceId" text NULL,
        "actions" text[] NOT NULL DEFAULT '{}',
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
    `)

    // espalha registros do formato novo para o antigo
    // ALL_SPACES => 1 linha com scope='all'
    await queryRunner.query(`
      INSERT INTO "module_access_grants_old"
        ("companyId","userId","moduleKey","scope","spaceId","actions","updatedAt")
      SELECT
        mag."companyId",
        mag."userId",
        mag."moduleKey",
        'all' AS scope,
        NULL::text AS "spaceId",
        (
          CASE
            WHEN mag."canEdit" = TRUE THEN ARRAY['view','edit']::text[]
            WHEN mag."canView" = TRUE THEN ARRAY['view']::text[]
            ELSE '{}'::text[]
          END
        ) AS actions,
        NOW()
      FROM "module_access_grants" mag
      WHERE mag."scopeType" = 'ALL_SPACES';
    `)

    // SPACE_IDS => N linhas (uma por spaceId) com scope='space'
    await queryRunner.query(`
      INSERT INTO "module_access_grants_old"
        ("companyId","userId","moduleKey","scope","spaceId","actions","updatedAt")
      SELECT
        mag."companyId",
        mag."userId",
        mag."moduleKey",
        'space' AS scope,
        sid AS "spaceId",
        (
          CASE
            WHEN mag."canEdit" = TRUE THEN ARRAY['view','edit']::text[]
            WHEN mag."canView" = TRUE THEN ARRAY['view']::text[]
            ELSE '{}'::text[]
          END
        ) AS actions,
        NOW()
      FROM "module_access_grants" mag
      CROSS JOIN LATERAL UNNEST(COALESCE(mag."spaceIds",'{}'::text[])) AS sid
      WHERE mag."scopeType" = 'SPACE_IDS';
    `)

    await queryRunner.query(`DROP TABLE "module_access_grants";`)
    await queryRunner.query(`ALTER TABLE "module_access_grants_old" RENAME TO "module_access_grants";`)

    // índice antigo (único por companyId,userId,moduleKey,scope,spaceId)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_module_access_grants_old_unique"
      ON "module_access_grants" ("companyId","userId","moduleKey","scope","spaceId");
    `)
  }
}