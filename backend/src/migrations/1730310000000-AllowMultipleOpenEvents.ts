// src/migrations/1730310000000-AllowMultipleOpenEvents.ts
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AllowMultipleOpenEvents1730310000000 implements MigrationInterface {
  name = 'AllowMultipleOpenEvents1730310000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove o índice único parcial de OPEN, caso exista
    await queryRunner.query(`DROP INDEX IF EXISTS "uniq_open_event_per_user"`)
    // Opcional: garantir índice normal para consultas
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relkind = 'i'
            AND c.relname = 'idx_news_event_company_news_user_type'
        ) THEN
          CREATE INDEX "idx_news_event_company_news_user_type"
          ON "news_interaction_event" ("companyId","newsId","userId","type");
        END IF;
      END$$;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recria o índice único parcial (volta ao comportamento antigo)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relkind = 'i'
            AND c.relname = 'uniq_open_event_per_user'
        ) THEN
          CREATE UNIQUE INDEX "uniq_open_event_per_user"
          ON "news_interaction_event" ("companyId","newsId","userId","type")
          WHERE "type" = 'OPEN';
        END IF;
      END$$;
    `)
  }
}