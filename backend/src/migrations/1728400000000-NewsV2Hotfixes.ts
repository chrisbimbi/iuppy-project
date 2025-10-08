import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewsV2Hotfixes1728400000000 implements MigrationInterface {
  name = 'NewsV2Hotfixes1728400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Coluna para snapshot de audiência no momento da publicação (se não existir)
    const hasAudienceSnapshotCol = await queryRunner.hasColumn(
      'news_entity',
      'audienceSnapshotAtPublish',
    );
    if (!hasAudienceSnapshotCol) {
      await queryRunner.query(`
        ALTER TABLE "news_entity"
        ADD COLUMN "audienceSnapshotAtPublish" integer
      `);
      // (Opcional) inicializa com 0 para evitar nulls em consultas antigas:
      // await queryRunner.query(`UPDATE "news_entity" SET "audienceSnapshotAtPublish" = 0 WHERE "audienceSnapshotAtPublish" IS NULL`);
    }

    // 2) Índices recomendados (idempotentes)
    // reactions
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_news_reaction_company_news"
      ON "news_reaction" ("companyId","newsId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_news_reaction_company_user_news"
      ON "news_reaction" ("companyId","userId","newsId")
    `);

    // comments (feed + paginação por createdAt DESC com filtro approved)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_news_comment_company_news_approved_createdat"
      ON "news_comment" ("companyId","newsId","approved","createdAt" DESC)
    `);

    // shares
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_news_share_company_news"
      ON "news_share" ("companyId","newsId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_news_share_company_user_news"
      ON "news_share" ("companyId","userId","newsId")
    `);

    // audience snapshot (garante unicidade)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_news_audience_company_news_user"
      ON "news_audience" ("companyId","newsId","userId")
    `);

    // 3) (Opcional) Índices em tabela de eventos de interações.
    // Como o nome/colunas variam por instalação e já há um introspector no código,
    // deixo aqui um exemplo comentado — ajuste conforme seu schema real:
    //
    // await queryRunner.query(`
    //   CREATE INDEX IF NOT EXISTS "idx_evt_company_news_type"
    //   ON event_table ("companyId", news_ref, (UPPER(type_col::text)))
    // `);
    // await queryRunner.query(`
    //   CREATE INDEX IF NOT EXISTS "idx_evt_company_news_type_user"
    //   ON event_table ("companyId", news_ref, (UPPER(type_col::text)), user_col)
    // `);
    // await queryRunner.query(`
    //   CREATE INDEX IF NOT EXISTS "idx_evt_company_user_news"
    //   ON event_table ("companyId", user_col, news_ref)
    // `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverte índices (sem erro se não existirem)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_news_audience_company_news_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_news_share_company_user_news"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_news_share_company_news"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_news_comment_company_news_approved_createdat"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_news_reaction_company_user_news"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_news_reaction_company_news"`);

    // Coluna de snapshot
    const hasAudienceSnapshotCol = await queryRunner.hasColumn(
      'news_entity',
      'audienceSnapshotAtPublish',
    );
    if (hasAudienceSnapshotCol) {
      await queryRunner.query(`
        ALTER TABLE "news_entity"
        DROP COLUMN "audienceSnapshotAtPublish"
      `);
    }
  }
}