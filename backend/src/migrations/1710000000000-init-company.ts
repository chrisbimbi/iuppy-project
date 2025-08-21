import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitCompany1710000000000 implements MigrationInterface {
    name = 'InitCompany1710000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Se quiser usar gen_random_uuid() em alguma tabela no futuro:
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "companies" (
        "id" uuid PRIMARY KEY,
        "name" varchar NOT NULL,
        "logo" varchar,
        "description" text
      )
    `);

        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "company_settings" (
        "companyId" uuid PRIMARY KEY,
        "defaultLocale" varchar NOT NULL DEFAULT 'pt',
        "supportedLocales" text NOT NULL DEFAULT 'pt,en,es,de',
        "logoUrl" varchar,
        "primary" varchar,
        "success" varchar,
        "info" varchar,
        "warning" varchar,
        "danger" varchar,
        "gray900" varchar,
        "gray600" varchar,
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_company_settings_company" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);

        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "company_modules" (
        "id" uuid PRIMARY KEY,
        "companyId" uuid NOT NULL,
        "key" varchar NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "config" jsonb,
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_company_modules_company_key"
      ON "company_modules" ("companyId","key")
    `);

        await queryRunner.query(`
      ALTER TABLE "company_modules"
      ADD CONSTRAINT "FK_company_modules_company"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company_modules" DROP CONSTRAINT IF EXISTS "FK_company_modules_company"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_company_modules_company_key"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "company_modules"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "company_settings"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "companies"`);
    }
}