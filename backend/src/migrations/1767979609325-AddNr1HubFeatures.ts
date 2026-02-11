import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNr1HubFeatures1767979609325 implements MigrationInterface {
    name = 'AddNr1HubFeatures1767979609325'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create Risk Types (NEW)
        await queryRunner.query(`DROP TABLE IF EXISTS "nr1_risk_types" CASCADE`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "nr1_risk_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" uuid NOT NULL, "name" character varying NOT NULL, "description" character varying, "color" character varying, "icon" character varying, "active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_82ff8ad00be1efcfbabfbca1600" PRIMARY KEY ("id"))`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_c87ae7b676bd8fd6fa1357026a"`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_c87ae7b676bd8fd6fa1357026a" ON "nr1_risk_types" ("companyId") `);

        // Add isNr1 columns (NEW)
        await queryRunner.query(`ALTER TABLE "news_entity" ADD IF NOT EXISTS "isNr1" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "journeys" ADD IF NOT EXISTS "isNr1" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "gamification_badge" ADD IF NOT EXISTS "isNr1" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "form" ADD IF NOT EXISTS "isNr1" boolean NOT NULL DEFAULT false`);

        // Add risk_type_id to risk_records (NEW)
        await queryRunner.query(`ALTER TABLE "nr1_risk_records" ADD IF NOT EXISTS "risk_type_id" uuid`);
        await queryRunner.query(`ALTER TABLE "nr1_risk_records" DROP CONSTRAINT IF EXISTS "FK_c656ae9a7e8eacbb63be152f86b"`);
        await queryRunner.query(`UPDATE "nr1_risk_records" SET "risk_type_id" = NULL`);
        await queryRunner.query(`DO $$ BEGIN ALTER TABLE "nr1_risk_records" ADD CONSTRAINT "FK_c656ae9a7e8eacbb63be152f86b" FOREIGN KEY ("risk_type_id") REFERENCES "nr1_risk_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object THEN null; WHEN duplicate_table THEN null; END $$;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nr1_action_plans" DROP CONSTRAINT IF EXISTS "FK_4c6b4d9e169fbf70fe0e770a7aa"`);
        await queryRunner.query(`ALTER TABLE "nr1_risk_records" DROP CONSTRAINT IF EXISTS "FK_c656ae9a7e8eacbb63be152f86b"`);
        await queryRunner.query(`ALTER TABLE "nr1_risk_records" DROP CONSTRAINT IF EXISTS "FK_491cdedcb462e93b6b0f1b77d3d"`);
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "groupIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "spaceIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user_entity" ALTER COLUMN "groups" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "space" ALTER COLUMN "distributionChannels" SET DEFAULT ARRAY['app'`);
        await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "adminIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "conditions" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "form" DROP COLUMN IF EXISTS "isNr1"`);
        await queryRunner.query(`ALTER TABLE "gamification_badge" DROP COLUMN IF EXISTS "isNr1"`);
        await queryRunner.query(`ALTER TABLE "journeys" DROP COLUMN IF EXISTS "isNr1"`);
        await queryRunner.query(`ALTER TABLE "news_entity" DROP COLUMN IF EXISTS "isNr1"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_a9d16cbcb2f203b11923ef8dc6"`);
        await queryRunner.query(`DROP TABLE "nr1_trainings"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_trainings_modalidade_enum"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_trainings_tipo_enum"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_4c6b4d9e169fbf70fe0e770a7a"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_8b9170a817984af912feb734d6"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_508f54765fe2a11f2fd52c2008"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_237d44799ea81953bbf8077406"`);
        await queryRunner.query(`DROP TABLE "nr1_action_plans"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_action_plans_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_action_plans_prioridade_enum"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_60280f8e57fec41bd5e32326fa"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_ec9d1b867b8a964b7d4e2a3d94"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_7306be8851c1b15e23e059c434"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_64836d40b00731d07445abf071"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_ae1964f4d37ebc00106e3e5eb1"`);
        await queryRunner.query(`DROP TABLE "nr1_risk_records"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_risk_records_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_risk_records_classificacao_risco_enum"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_c87ae7b676bd8fd6fa1357026a"`);
        await queryRunner.query(`DROP TABLE "nr1_risk_types"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_10c65e0105f10f0cb44c8dfedd"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_71b32a770a5be1248e5ffbc113"`);
        await queryRunner.query(`DROP TABLE "nr1_risk_criteria"`);
    }

}
