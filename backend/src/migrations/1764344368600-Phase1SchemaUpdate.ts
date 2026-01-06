import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase1SchemaUpdate1764344368600 implements MigrationInterface {
  name = 'Phase1SchemaUpdate1764344368600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "survey_question" DROP CONSTRAINT "FK_survey_question_surveyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_response" DROP CONSTRAINT "FK_survey_response_surveyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group_members" DROP CONSTRAINT "FK_user_group_members_group"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group_members" DROP CONSTRAINT "FK_user_group_members_user"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_user_entity_email"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_metrics_daily_news_date"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_news_metrics_daily_unique"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."news_metrics_daily_companyId_newsId_date_unique"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_news_audience_company_news"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_news_audience_user"`);
    await queryRunner.query(
      `CREATE TABLE "user_metrics_daily" ("userId" uuid NOT NULL, "date" date NOT NULL, "appOpens" integer NOT NULL DEFAULT '0', "newsOpens" integer NOT NULL DEFAULT '0', "newsUniqueOpens" integer NOT NULL DEFAULT '0', "reactions" integer NOT NULL DEFAULT '0', "comments" integer NOT NULL DEFAULT '0', "shares" integer NOT NULL DEFAULT '0', "surveyResponses" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_cfa54867892d5a14f107c44db4b" PRIMARY KEY ("userId", "date"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cfa54867892d5a14f107c44db4" ON "user_metrics_daily" ("userId", "date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "search_metrics_daily" ("companyId" uuid NOT NULL, "date" date NOT NULL, "queryHash" character varying(64) NOT NULL, "sampleQuery" text, "queries" integer NOT NULL DEFAULT '0', "uniqueUsers" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_a3e62b00457fcee56deddee8dd6" PRIMARY KEY ("companyId", "date", "queryHash"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dcd8e90ea3488c2345066ed44b" ON "search_metrics_daily" ("companyId", "date") `,
    );
    await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "active"`);
    await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "spaceIds"`);
    await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "groupIds"`);
    await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "news_interaction_event" DROP COLUMN "channel"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_comment" DROP COLUMN "is_approved"`,
    );
    await queryRunner.query(`ALTER TABLE "news_share" DROP COLUMN "platform"`);
    await queryRunner.query(
      `ALTER TABLE "news_metrics_daily" DROP COLUMN "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_metrics_daily" DROP COLUMN "companyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_metrics_daily" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_metrics_daily" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_audience" DROP CONSTRAINT "PK_news_audience"`,
    );
    await queryRunner.query(`ALTER TABLE "news_audience" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "user_group" ADD "description" text`);
    await queryRunner.query(
      `ALTER TABLE "user_group" ADD "isAutoCreated" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "user_entity" ADD "department" text`);
    await queryRunner.query(`ALTER TABLE "user_entity" ADD "jobTitle" text`);
    await queryRunner.query(`ALTER TABLE "user_entity" ADD "location" text`);
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "hireDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "customAttributes" jsonb NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(`ALTER TABLE "user_entity" ADD "syncKey" text`);
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD CONSTRAINT "UQ_d3433b73c5412cfe13671232cdc" UNIQUE ("syncKey")`,
    );
    await queryRunner.query(`ALTER TABLE "companies" ADD "menuConfig" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "menuConfig" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_share" ADD "channel" character varying NOT NULL DEFAULT 'app'`,
    );
    await queryRunner.query(`ALTER TABLE "news_share" ADD "meta" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "news_audience" ADD "origemDaRegra" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "push_delivery" ADD "updatedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "push_delivery" ADD "sentAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "push_delivery" ADD "deliveredAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "push_delivery" ADD "openedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "push_delivery" ADD "provider" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "push_delivery" ADD "channel" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "push_delivery" ADD "messageId" text`);
    await queryRunner.query(`ALTER TABLE "push_delivery" ADD "meta" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "journey_steps" ADD "smartFields" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "journeys" ADD "gamificationId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_audience" ADD CONSTRAINT "PK_b7e11b49121413c7446cf4cd328" PRIMARY KEY ("companyId", "newsId", "userId")`,
    );
    await queryRunner.query(`ALTER TABLE "user_group" DROP COLUMN "type"`);
    await queryRunner.query(
      `CREATE TYPE "public"."user_group_type_enum" AS ENUM('OPEN', 'INTERNAL', 'CONDITIONAL', 'MANDATORY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group" ADD "type" "public"."user_group_type_enum" NOT NULL DEFAULT 'INTERNAL'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group" ALTER COLUMN "conditions" SET DEFAULT ARRAY[]::text[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group" ALTER COLUMN "adminIds" SET DEFAULT ARRAY[]::text[]`,
    );
    await queryRunner.query(`ALTER TABLE "user_group" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "user_group" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "user_group" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "user_group" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "role"`);
    await queryRunner.query(
      `CREATE TYPE "public"."user_entity_role_enum" AS ENUM('super_admin', 'company_admin', 'hr_admin', 'content_admin', 'manager', 'editor', 'viewer', 'user')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "role" "public"."user_entity_role_enum" NOT NULL DEFAULT 'hr_admin'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ALTER COLUMN "groups" SET DEFAULT ARRAY[]::text[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "type"`);
    await queryRunner.query(
      `CREATE TYPE "public"."channel_type_enum" AS ENUM('articles', 'media', 'updates')`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel" ADD "type" "public"."channel_type_enum" NOT NULL DEFAULT 'articles'`,
    );
    // await queryRunner.query(`ALTER TABLE "channel" ALTER COLUMN "is_published" SET NOT NULL`);
    // await queryRunner.query(`ALTER TABLE "channel" ALTER COLUMN "position" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "space" ALTER COLUMN "distributionChannels" SET DEFAULT ARRAY['app']`,
    );
    await queryRunner.query(`ALTER TABLE "space" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "space" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "space" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "space" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" ALTER COLUMN "authorId" SET NOT NULL`,
    );
    // await queryRunner.query(`ALTER TABLE "news_entity" DROP COLUMN "channelId"`);
    await queryRunner.query(
      `ALTER TABLE "news_entity" ADD COLUMN IF NOT EXISTS "channelId" character varying NOT NULL DEFAULT 'general'`,
    );
    // await queryRunner.query(`ALTER TABLE "news_entity" ALTER COLUMN "isPublished" SET NOT NULL`);
    // await queryRunner.query(`ALTER TABLE "news_entity" ALTER COLUMN "title" SET NOT NULL`);
    // await queryRunner.query(`ALTER TABLE "news_entity" ALTER COLUMN "content" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "news_entity" DROP COLUMN "type"`);
    await queryRunner.query(
      `CREATE TYPE "public"."news_entity_type_enum" AS ENUM('ANNOUNCEMENT', 'UPDATE', 'ALERT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" ADD "type" "public"."news_entity_type_enum" NOT NULL DEFAULT 'ANNOUNCEMENT'`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" DROP COLUMN "attachments"`,
    );
    await queryRunner.query(`ALTER TABLE "news_entity" ADD "attachments" text`);
    await queryRunner.query(
      `ALTER TABLE "news_entity" DROP COLUMN "highlightImages"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" ADD "highlightImages" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" ALTER COLUMN "settings" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey" ALTER COLUMN "spaceIds" SET DEFAULT ARRAY[]::text[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey" ALTER COLUMN "groupIds" SET DEFAULT ARRAY[]::text[]`,
    );
    // await queryRunner.query(`ALTER TABLE "company_settings" ALTER COLUMN "defaultLocale" SET NOT NULL`);
    // await queryRunner.query(`ALTER TABLE "company_settings" ALTER COLUMN "supportedLocales" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "company_settings" ALTER COLUMN "supportedLocales" SET DEFAULT '{pt-BR,pt,en,es,de}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "logoUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "logoUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "appTitle"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "appTitle" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "appSubtitle"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "appSubtitle" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "primary"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "primary" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "success"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "success" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "info"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "info" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "warning"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "warning" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "danger"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "danger" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "gray900"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "gray900" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "gray600"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "gray600" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "background"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "background" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "textOnBackground"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "textOnBackground" character varying`,
    );
    // await queryRunner.query(`ALTER TABLE "company_settings" ALTER COLUMN "updatedAt" SET NOT NULL`);
    // await queryRunner.query(`ALTER TABLE "company_modules" ALTER COLUMN "enabled" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "company_modules" ALTER COLUMN "config" DROP DEFAULT`,
    );
    // await queryRunner.query(`ALTER TABLE "company_modules" ALTER COLUMN "updatedAt" SET NOT NULL`);
    // await queryRunner.query(`ALTER TABLE "news_interaction_event" DROP COLUMN "companyId"`);
    await queryRunner.query(
      `ALTER TABLE "news_interaction_event" ADD COLUMN IF NOT EXISTS "companyId" uuid`,
    );
    // await queryRunner.query(`ALTER TABLE "news_interaction_event" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "news_interaction_event" ADD COLUMN IF NOT EXISTS "userId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_interaction_event" DROP COLUMN "type"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."news_interaction_event_type_enum" AS ENUM('OPEN', 'ACK', 'REACTION', 'COMMENT', 'SHARE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_interaction_event" ADD "type" "public"."news_interaction_event_type_enum" NOT NULL DEFAULT 'OPEN'`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_interaction_event" ALTER COLUMN "createdAt" SET NOT NULL`,
    );
    // await queryRunner.query(`ALTER TABLE "news_reaction" DROP COLUMN "companyId"`);
    await queryRunner.query(
      `ALTER TABLE "news_reaction" ADD COLUMN IF NOT EXISTS "companyId" uuid`,
    );
    // await queryRunner.query(`ALTER TABLE "news_reaction" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "news_reaction" ADD COLUMN IF NOT EXISTS "userId" uuid`,
    );
    // await queryRunner.query(`ALTER TABLE "news_reaction" ALTER COLUMN "createdAt" SET NOT NULL`);
    // await queryRunner.query(`ALTER TABLE "news_comment" DROP COLUMN "companyId"`);
    await queryRunner.query(
      `ALTER TABLE "news_comment" ADD COLUMN IF NOT EXISTS "companyId" uuid`,
    );
    // await queryRunner.query(`ALTER TABLE "news_comment" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "news_comment" ADD COLUMN IF NOT EXISTS "userId" uuid`,
    );
    // await queryRunner.query(`ALTER TABLE "news_comment" ALTER COLUMN "approved" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "news_comment" ALTER COLUMN "approved" SET DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_comment" ALTER COLUMN "createdAt" SET NOT NULL`,
    );
    // await queryRunner.query(`ALTER TABLE "news_share" DROP COLUMN "companyId"`);
    await queryRunner.query(
      `ALTER TABLE "news_share" ADD COLUMN IF NOT EXISTS "companyId" uuid`,
    );
    // await queryRunner.query(`ALTER TABLE "news_share" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "news_share" ADD COLUMN IF NOT EXISTS "userId" uuid`,
    );
    // await queryRunner.query(`ALTER TABLE "news_share" ALTER COLUMN "createdAt" SET NOT NULL`);
    // await queryRunner.query(`ALTER TABLE "news_metrics_daily" ALTER COLUMN "opens" SET NOT NULL`);
    // await queryRunner.query(`ALTER TABLE "news_metrics_daily" ALTER COLUMN "uniqueOpens" SET NOT NULL`);
    // await queryRunner.query(`ALTER TABLE "news_metrics_daily" ALTER COLUMN "acks" SET NOT NULL`);
    // await queryRunner.query(`ALTER TABLE "news_metrics_daily" ALTER COLUMN "reactions" SET NOT NULL`);
    // await queryRunner.query(`ALTER TABLE "news_metrics_daily" ALTER COLUMN "comments" SET NOT NULL`);
    // await queryRunner.query(`ALTER TABLE "news_metrics_daily" ALTER COLUMN "shares" SET NOT NULL`);
    // await queryRunner.query(`ALTER TABLE "news_audience" ALTER COLUMN "createdAt" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "push_delivery" ALTER COLUMN "companyId" DROP NOT NULL`,
    );
    // await queryRunner.query(`ALTER TABLE "push_delivery" ALTER COLUMN "createdAt" SET NOT NULL`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_415c35b9b3b6fe45a3b065030f" ON "user_entity" ("email") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_43db73e9deada0ed0eb4f6a0d0" ON "company_modules" ("companyId", "key") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_858b14f91c48cc6a2c2a14d458" ON "news_interaction_event" ("companyId", "newsId", "userId", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_799b86b522c3326b8cab82e2b9" ON "news_interaction_event" ("companyId", "newsId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_56fd105d286f8032e6ee017831" ON "news_reaction" ("companyId", "newsId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f0de048ce06fef98a288576c5" ON "news_comment" ("companyId", "newsId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7bbe96abc17d7c43dc33b007fe" ON "news_share" ("companyId", "newsId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2aa31b95cd04f1783dad7a49f6" ON "news_metrics_daily" ("newsId", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b152f294a9ded6e1df99c94a67" ON "news_audience" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8aafc80cc7f74afeeee5c20595" ON "news_audience" ("companyId", "newsId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_21c1635b50aa9a4330e507e9e7" ON "push_delivery" ("companyId", "userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fc95a2f4e06e84024b7b4649e3" ON "push_delivery" ("companyId", "newsId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0ff9c9893bced1f20a11c992c1" ON "user_group_members" ("group_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_32ba1d353e99d14130486cd34c" ON "user_group_members" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "news_reaction" ADD CONSTRAINT "uniq_user_reaction_per_news" UNIQUE ("companyId", "newsId", "userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_question" ADD CONSTRAINT "FK_036a359b4a0884d113f6232e96d" FOREIGN KEY ("surveyId") REFERENCES "survey"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_response" ADD CONSTRAINT "FK_325dc8ed7bbdea328af1670dc0a" FOREIGN KEY ("surveyId") REFERENCES "survey"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group_members" ADD CONSTRAINT "FK_0ff9c9893bced1f20a11c992c16" FOREIGN KEY ("group_id") REFERENCES "user_group"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group_members" ADD CONSTRAINT "FK_32ba1d353e99d14130486cd34cf" FOREIGN KEY ("user_id") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_group_members" DROP CONSTRAINT "FK_32ba1d353e99d14130486cd34cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group_members" DROP CONSTRAINT "FK_0ff9c9893bced1f20a11c992c16"`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_response" DROP CONSTRAINT "FK_325dc8ed7bbdea328af1670dc0a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_question" DROP CONSTRAINT "FK_036a359b4a0884d113f6232e96d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_reaction" DROP CONSTRAINT "uniq_user_reaction_per_news"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_32ba1d353e99d14130486cd34c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0ff9c9893bced1f20a11c992c1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fc95a2f4e06e84024b7b4649e3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_21c1635b50aa9a4330e507e9e7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8aafc80cc7f74afeeee5c20595"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b152f294a9ded6e1df99c94a67"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2aa31b95cd04f1783dad7a49f6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7bbe96abc17d7c43dc33b007fe"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7f0de048ce06fef98a288576c5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_56fd105d286f8032e6ee017831"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_799b86b522c3326b8cab82e2b9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_858b14f91c48cc6a2c2a14d458"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_43db73e9deada0ed0eb4f6a0d0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_415c35b9b3b6fe45a3b065030f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "push_delivery" ALTER COLUMN "createdAt" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "push_delivery" ALTER COLUMN "companyId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_audience" ALTER COLUMN "createdAt" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_metrics_daily" ALTER COLUMN "shares" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_metrics_daily" ALTER COLUMN "comments" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_metrics_daily" ALTER COLUMN "reactions" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_metrics_daily" ALTER COLUMN "acks" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_metrics_daily" ALTER COLUMN "uniqueOpens" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_metrics_daily" ALTER COLUMN "opens" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_share" ALTER COLUMN "createdAt" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "news_share" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "news_share" ADD "userId" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "news_share" DROP COLUMN "companyId"`);
    await queryRunner.query(
      `ALTER TABLE "news_share" ADD "companyId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_comment" ALTER COLUMN "createdAt" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_comment" ALTER COLUMN "approved" SET DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_comment" ALTER COLUMN "approved" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "news_comment" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "news_comment" ADD "userId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_comment" DROP COLUMN "companyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_comment" ADD "companyId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_reaction" ALTER COLUMN "createdAt" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "news_reaction" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "news_reaction" ADD "userId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_reaction" DROP COLUMN "companyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_reaction" ADD "companyId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_interaction_event" ALTER COLUMN "createdAt" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_interaction_event" DROP COLUMN "type"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."news_interaction_event_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_interaction_event" ADD "type" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_interaction_event" DROP COLUMN "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_interaction_event" ADD "userId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_interaction_event" DROP COLUMN "companyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_interaction_event" ADD "companyId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_modules" ALTER COLUMN "updatedAt" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_modules" ALTER COLUMN "config" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_modules" ALTER COLUMN "enabled" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ALTER COLUMN "updatedAt" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "textOnBackground"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "textOnBackground" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "background"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "background" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "gray600"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "gray600" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "gray900"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "gray900" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "danger"`,
    );
    await queryRunner.query(`ALTER TABLE "company_settings" ADD "danger" text`);
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "warning"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "warning" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "info"`,
    );
    await queryRunner.query(`ALTER TABLE "company_settings" ADD "info" text`);
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "success"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "success" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "primary"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "primary" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "appSubtitle"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "appSubtitle" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "appTitle"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "appTitle" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "logoUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "logoUrl" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ALTER COLUMN "supportedLocales" SET DEFAULT ARRAY['pt-BR'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ALTER COLUMN "supportedLocales" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ALTER COLUMN "defaultLocale" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey" ALTER COLUMN "groupIds" SET DEFAULT ARRAY[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey" ALTER COLUMN "spaceIds" SET DEFAULT ARRAY[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" ADD "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" ADD "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" ALTER COLUMN "settings" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" DROP COLUMN "highlightImages"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" ADD "highlightImages" jsonb DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" DROP COLUMN "attachments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" ADD "attachments" jsonb DEFAULT '[]'`,
    );
    await queryRunner.query(`ALTER TABLE "news_entity" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."news_entity_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "news_entity" ADD "type" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" ALTER COLUMN "content" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" ALTER COLUMN "title" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" ALTER COLUMN "isPublished" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_entity" DROP COLUMN "channelId"`,
    );
    await queryRunner.query(`ALTER TABLE "news_entity" ADD "channelId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "news_entity" ALTER COLUMN "authorId" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "space" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "space" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "space" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "space" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "space" ALTER COLUMN "distributionChannels" SET DEFAULT ARRAY['app'`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel" ALTER COLUMN "position" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel" ALTER COLUMN "is_published" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."channel_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "channel" ADD "type" character varying DEFAULT 'default'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ALTER COLUMN "groups" SET DEFAULT ARRAY[]`,
    );
    await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."user_entity_role_enum"`);
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "role" character varying NOT NULL DEFAULT 'hr_admin'`,
    );
    await queryRunner.query(`ALTER TABLE "user_group" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "user_group" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "user_group" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "user_group" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group" ALTER COLUMN "adminIds" SET DEFAULT ARRAY[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group" ALTER COLUMN "conditions" SET DEFAULT ARRAY[]`,
    );
    await queryRunner.query(`ALTER TABLE "user_group" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."user_group_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "user_group" ADD "type" character varying NOT NULL DEFAULT 'internal'`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_audience" DROP CONSTRAINT "PK_b7e11b49121413c7446cf4cd328"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journeys" DROP COLUMN "gamificationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journey_steps" DROP COLUMN "smartFields"`,
    );
    await queryRunner.query(`ALTER TABLE "push_delivery" DROP COLUMN "meta"`);
    await queryRunner.query(
      `ALTER TABLE "push_delivery" DROP COLUMN "messageId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "push_delivery" DROP COLUMN "channel"`,
    );
    await queryRunner.query(
      `ALTER TABLE "push_delivery" DROP COLUMN "provider"`,
    );
    await queryRunner.query(
      `ALTER TABLE "push_delivery" DROP COLUMN "openedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "push_delivery" DROP COLUMN "deliveredAt"`,
    );
    await queryRunner.query(`ALTER TABLE "push_delivery" DROP COLUMN "sentAt"`);
    await queryRunner.query(
      `ALTER TABLE "push_delivery" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_audience" DROP COLUMN "origemDaRegra"`,
    );
    await queryRunner.query(`ALTER TABLE "news_share" DROP COLUMN "meta"`);
    await queryRunner.query(`ALTER TABLE "news_share" DROP COLUMN "channel"`);
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "menuConfig"`,
    );
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "menuConfig"`);
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP CONSTRAINT "UQ_d3433b73c5412cfe13671232cdc"`,
    );
    await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "syncKey"`);
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP COLUMN "customAttributes"`,
    );
    await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "hireDate"`);
    await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "location"`);
    await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "jobTitle"`);
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP COLUMN "department"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group" DROP COLUMN "isAutoCreated"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_audience" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_audience" ADD CONSTRAINT "PK_news_audience" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_metrics_daily" ADD "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_metrics_daily" ADD "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_metrics_daily" ADD "companyId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_metrics_daily" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_share" ADD "platform" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_comment" ADD "is_approved" boolean DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_interaction_event" ADD "channel" character varying DEFAULT 'app'`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel" ADD "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel" ADD "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "channel" ADD "groupIds" text array`);
    await queryRunner.query(`ALTER TABLE "channel" ADD "spaceIds" text array`);
    await queryRunner.query(
      `ALTER TABLE "channel" ADD "active" boolean DEFAULT true`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dcd8e90ea3488c2345066ed44b"`,
    );
    await queryRunner.query(`DROP TABLE "search_metrics_daily"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cfa54867892d5a14f107c44db4"`,
    );
    await queryRunner.query(`DROP TABLE "user_metrics_daily"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_news_audience_user" ON "news_audience" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_news_audience_company_news" ON "news_audience" ("companyId", "newsId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "news_metrics_daily_companyId_newsId_date_unique" ON "news_metrics_daily" ("companyId", "newsId", "date") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_news_metrics_daily_unique" ON "news_metrics_daily" ("companyId", "newsId", "date") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_metrics_daily_news_date" ON "news_metrics_daily" ("newsId", "date") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_entity_email" ON "user_entity" ("email") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group_members" ADD CONSTRAINT "FK_user_group_members_user" FOREIGN KEY ("user_id") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group_members" ADD CONSTRAINT "FK_user_group_members_group" FOREIGN KEY ("group_id") REFERENCES "user_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_response" ADD CONSTRAINT "FK_survey_response_surveyId" FOREIGN KEY ("surveyId") REFERENCES "survey"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_question" ADD CONSTRAINT "FK_survey_question_surveyId" FOREIGN KEY ("surveyId") REFERENCES "survey"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
