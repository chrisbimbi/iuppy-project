import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCompanyEsocialConfig1768000592113 implements MigrationInterface {
    name = 'CreateCompanyEsocialConfig1768000592113'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "nr1_risk_criteria" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "modelo" jsonb NOT NULL, "version" character varying(40) NOT NULL, "assinado_icp" boolean NOT NULL DEFAULT false, "assinatura_manifesto" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e01f9aeec0ccbf22ac77eb6b374" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_71b32a770a5be1248e5ffbc113" ON "nr1_risk_criteria" ("company_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_10c65e0105f10f0cb44c8dfedd" ON "nr1_risk_criteria" ("company_id", "version") `);
        await queryRunner.query(`CREATE TABLE "nr1_risk_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" uuid NOT NULL, "name" character varying NOT NULL, "description" character varying, "color" character varying, "icon" character varying, "active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_82ff8ad00be1efcfbabfbca1600" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c87ae7b676bd8fd6fa1357026a" ON "nr1_risk_types" ("companyId") `);
        await queryRunner.query(`CREATE TYPE "public"."nr1_risk_records_classificacao_risco_enum" AS ENUM('b', 'm', 'a', 'ma')`);
        await queryRunner.query(`CREATE TYPE "public"."nr1_risk_records_status_enum" AS ENUM('ativo', 'inativo')`);
        await queryRunner.query(`CREATE TABLE "nr1_risk_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "space_id" uuid, "channel_id" uuid, "processo" character varying(160) NOT NULL, "ambiente" character varying(160) NOT NULL, "atividade" character varying(160) NOT NULL, "perigo" text NOT NULL, "fonte_circunstancia" text NOT NULL, "possiveis_lesoes" text NOT NULL, "grupos_expostos" jsonb NOT NULL, "medidas_prevencao" jsonb NOT NULL, "caracterizacao_exposicao" text NOT NULL, "classificacao_risco" "public"."nr1_risk_records_classificacao_risco_enum" NOT NULL, "criterios_id" uuid, "risk_type_id" uuid, "status" "public"."nr1_risk_records_status_enum" NOT NULL DEFAULT 'ativo', "version" integer NOT NULL DEFAULT '1', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_33c102bc6848f3c31898da1988d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ae1964f4d37ebc00106e3e5eb1" ON "nr1_risk_records" ("company_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_64836d40b00731d07445abf071" ON "nr1_risk_records" ("space_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7306be8851c1b15e23e059c434" ON "nr1_risk_records" ("channel_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ec9d1b867b8a964b7d4e2a3d94" ON "nr1_risk_records" ("company_id", "space_id", "channel_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_60280f8e57fec41bd5e32326fa" ON "nr1_risk_records" ("company_id", "status") `);
        await queryRunner.query(`CREATE TYPE "public"."nr1_action_plans_prioridade_enum" AS ENUM('P0', 'P1', 'P2', 'P3')`);
        await queryRunner.query(`CREATE TYPE "public"."nr1_action_plans_status_enum" AS ENUM('planejado', 'em_execucao', 'concluido', 'atrasado', 'cancelado')`);
        await queryRunner.query(`CREATE TABLE "nr1_action_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "risk_id" uuid NOT NULL, "medida_prevencao" text NOT NULL, "prioridade" "public"."nr1_action_plans_prioridade_enum" NOT NULL DEFAULT 'P2', "responsavel_id" uuid, "inicio_previsto" date, "fim_previsto" date, "forma_acompanhamento" text, "kpi" jsonb, "status" "public"."nr1_action_plans_status_enum" NOT NULL DEFAULT 'planejado', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2d35586ceb2e3088cf0d658c84d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_237d44799ea81953bbf8077406" ON "nr1_action_plans" ("responsavel_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_508f54765fe2a11f2fd52c2008" ON "nr1_action_plans" ("responsavel_id", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_8b9170a817984af912feb734d6" ON "nr1_action_plans" ("status", "prioridade") `);
        await queryRunner.query(`CREATE INDEX "IDX_4c6b4d9e169fbf70fe0e770a7a" ON "nr1_action_plans" ("risk_id") `);
        await queryRunner.query(`CREATE TYPE "public"."nr1_trainings_tipo_enum" AS ENUM('inicial', 'periodico', 'eventual')`);
        await queryRunner.query(`CREATE TYPE "public"."nr1_trainings_modalidade_enum" AS ENUM('presencial', 'EAD', 'semipresencial')`);
        await queryRunner.query(`CREATE TABLE "nr1_trainings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "titulo" text NOT NULL, "tipo" "public"."nr1_trainings_tipo_enum" NOT NULL, "modalidade" "public"."nr1_trainings_modalidade_enum" NOT NULL, "carga_horaria" numeric(5,1) NOT NULL, "projeto_pedagogico_url" text, "conteudos" jsonb NOT NULL, "requisitos_anexo_ii" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_de4b81b7d8e682c3f765b254c9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a9d16cbcb2f203b11923ef8dc6" ON "nr1_trainings" ("company_id") `);
        await queryRunner.query(`ALTER TABLE "news_entity" ADD "isNr1" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "journey_steps" ADD "quizConfig" jsonb`);
        await queryRunner.query(`ALTER TABLE "journeys" ADD "isNr1" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "gamification_badge" ADD "isNr1" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "form" ADD "isNr1" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "conditions" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "adminIds" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "space" ALTER COLUMN "distributionChannels" SET DEFAULT ARRAY['app']`);
        await queryRunner.query(`ALTER TABLE "user_entity" ALTER COLUMN "groups" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "spaceIds" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "groupIds" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "nr1_risk_records" ADD CONSTRAINT "FK_491cdedcb462e93b6b0f1b77d3d" FOREIGN KEY ("criterios_id") REFERENCES "nr1_risk_criteria"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "nr1_risk_records" ADD CONSTRAINT "FK_c656ae9a7e8eacbb63be152f86b" FOREIGN KEY ("risk_type_id") REFERENCES "nr1_risk_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "nr1_action_plans" ADD CONSTRAINT "FK_4c6b4d9e169fbf70fe0e770a7aa" FOREIGN KEY ("risk_id") REFERENCES "nr1_risk_records"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nr1_action_plans" DROP CONSTRAINT "FK_4c6b4d9e169fbf70fe0e770a7aa"`);
        await queryRunner.query(`ALTER TABLE "nr1_risk_records" DROP CONSTRAINT "FK_c656ae9a7e8eacbb63be152f86b"`);
        await queryRunner.query(`ALTER TABLE "nr1_risk_records" DROP CONSTRAINT "FK_491cdedcb462e93b6b0f1b77d3d"`);
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "groupIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "spaceIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user_entity" ALTER COLUMN "groups" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "space" ALTER COLUMN "distributionChannels" SET DEFAULT ARRAY['app'`);
        await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "adminIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "conditions" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "form" DROP COLUMN "isNr1"`);
        await queryRunner.query(`ALTER TABLE "gamification_badge" DROP COLUMN "isNr1"`);
        await queryRunner.query(`ALTER TABLE "journeys" DROP COLUMN "isNr1"`);
        await queryRunner.query(`ALTER TABLE "journey_steps" DROP COLUMN "quizConfig"`);
        await queryRunner.query(`ALTER TABLE "news_entity" DROP COLUMN "isNr1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a9d16cbcb2f203b11923ef8dc6"`);
        await queryRunner.query(`DROP TABLE "nr1_trainings"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_trainings_modalidade_enum"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_trainings_tipo_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4c6b4d9e169fbf70fe0e770a7a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8b9170a817984af912feb734d6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_508f54765fe2a11f2fd52c2008"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_237d44799ea81953bbf8077406"`);
        await queryRunner.query(`DROP TABLE "nr1_action_plans"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_action_plans_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_action_plans_prioridade_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_60280f8e57fec41bd5e32326fa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ec9d1b867b8a964b7d4e2a3d94"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7306be8851c1b15e23e059c434"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64836d40b00731d07445abf071"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ae1964f4d37ebc00106e3e5eb1"`);
        await queryRunner.query(`DROP TABLE "nr1_risk_records"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_risk_records_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_risk_records_classificacao_risco_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c87ae7b676bd8fd6fa1357026a"`);
        await queryRunner.query(`DROP TABLE "nr1_risk_types"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_10c65e0105f10f0cb44c8dfedd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_71b32a770a5be1248e5ffbc113"`);
        await queryRunner.query(`DROP TABLE "nr1_risk_criteria"`);
    }

}
