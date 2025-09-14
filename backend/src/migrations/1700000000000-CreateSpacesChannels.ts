import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSpacesChannels1700000000000 implements MigrationInterface {
  name = 'CreateSpacesChannels1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // uuid extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "spaces" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "companyId" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "slug" varchar(255) NOT NULL,
        "position" integer,
        "active" boolean DEFAULT true,
        "createdAt" TIMESTAMPTZ DEFAULT now(),
        "updatedAt" TIMESTAMPTZ DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "channels" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "companyId" uuid NOT NULL,
        "spaceId" uuid,
        "name" varchar(255) NOT NULL,
        "slug" varchar(255) NOT NULL,
        "position" integer,
        "active" boolean DEFAULT true,
        "createdAt" TIMESTAMPTZ DEFAULT now(),
        "updatedAt" TIMESTAMPTZ DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_spaces_company" ON "spaces" ("companyId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_channels_company" ON "channels" ("companyId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_channels_space" ON "channels" ("spaceId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "channels"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "spaces"`);
  }
}