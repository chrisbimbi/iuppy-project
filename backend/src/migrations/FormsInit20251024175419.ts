// backend/src/migrations/FormsInit20251024175419.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class FormsInit20251024175419 implements MigrationInterface {
  name = 'FormsInit20251024175419';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE form_status AS ENUM ('draft','published','expired','archived');
      CREATE TYPE form_field_type AS ENUM ('short_text','long_text','number','date','multi_choice','single_choice','stars','scale');
      CREATE TYPE form_submission_status AS ENUM ('pending','replied','approved','rejected');
      CREATE TYPE form_rh_action_type AS ENUM ('reply','approve','reject');

      CREATE TABLE IF NOT EXISTS form (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "companyId" uuid NOT NULL,
        title text NOT NULL,
        description text NULL,
        status form_status NOT NULL DEFAULT 'draft',
        "scheduleStartAt" timestamptz NULL,
        "scheduleEndAt" timestamptz NULL,
        "deadlineAt" timestamptz NULL,
        "allowMultipleSubmissions" boolean NOT NULL DEFAULT false,
        anonymous boolean NOT NULL DEFAULT false,
        "allowExternal" boolean NOT NULL DEFAULT false,
        "audienceSpaceIds" text[] DEFAULT ARRAY[]::text[],
        "audienceGroupIds" text[] DEFAULT ARRAY[]::text[],
        "attachmentsAllowed" boolean NOT NULL DEFAULT true,
        "attachmentHelpText" text NULL,
        "remindersConfig" jsonb NULL,
        "notificationsConfig" jsonb NULL,
        acl jsonb NULL,
        "createdBy" uuid NOT NULL,
        "publishedAt" timestamptz NULL,
        version int NOT NULL DEFAULT 1,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_form_company_status ON form("companyId", status);

      CREATE TABLE IF NOT EXISTS form_field (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "companyId" uuid NOT NULL,
        "formId" uuid NOT NULL,
        version int NOT NULL DEFAULT 1,
        type form_field_type NOT NULL,
        label text NOT NULL,
        required boolean NOT NULL DEFAULT false,
        options jsonb NULL,
        "order" int NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_form_field_company_form_version ON form_field("companyId","formId",version);

      CREATE TABLE IF NOT EXISTS form_submission (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "companyId" uuid NOT NULL,
        "formId" uuid NOT NULL,
        "submittedAt" timestamptz NULL,
        "userId" uuid NULL,
        external boolean NOT NULL DEFAULT false,
        "externalEmail" text NULL,
        "spaceIds" text[] DEFAULT ARRAY[]::text[],
        "groupIds" text[] DEFAULT ARRAY[]::text[],
        "isOnTime" boolean NULL,
        status form_submission_status NOT NULL DEFAULT 'pending',
        "replyCount" int NOT NULL DEFAULT 0,
        "fileCount" int NOT NULL DEFAULT 0,
        meta jsonb NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_form_submission_company_form_submitted ON form_submission("companyId","formId","submittedAt");
      CREATE INDEX IF NOT EXISTS idx_form_submission_status ON form_submission(status);

      CREATE TABLE IF NOT EXISTS form_answer (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "companyId" uuid NOT NULL,
        "submissionId" uuid NOT NULL,
        "formId" uuid NOT NULL,
        "fieldId" uuid NOT NULL,
        type text NOT NULL,
        value jsonb NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_form_answer_company_submission_form_field ON form_answer("companyId","submissionId","formId","fieldId");

      CREATE TABLE IF NOT EXISTS form_attachment (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "companyId" uuid NOT NULL,
        "submissionId" uuid NOT NULL,
        "formId" uuid NOT NULL,
        "storagePath" text NOT NULL,
        "mimeType" text NOT NULL,
        bytes bigint NOT NULL,
        "uploadedAt" timestamptz NOT NULL,
        status text NOT NULL DEFAULT 'ok',
        error text NULL
      );
      CREATE INDEX IF NOT EXISTS idx_form_attachment_company_submission_form ON form_attachment("companyId","submissionId","formId");

      CREATE TABLE IF NOT EXISTS form_rh_action (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "companyId" uuid NOT NULL,
        "submissionId" uuid NOT NULL,
        "formId" uuid NOT NULL,
        "actorUserId" uuid NOT NULL,
        type form_rh_action_type NOT NULL,
        message text NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_form_rh_action_company_submission_form ON form_rh_action("companyId","submissionId","formId");

      CREATE TABLE IF NOT EXISTS form_event (
        id bigserial PRIMARY KEY,
        "companyId" uuid NOT NULL,
        "formId" uuid NOT NULL,
        type text NOT NULL,
        "userId" uuid NULL,
        external boolean NOT NULL DEFAULT false,
        "externalEmail" text NULL,
        "fieldId" uuid NULL,
        meta jsonb NULL,
        ts timestamptz NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_form_event_company_form_ts ON form_event("companyId","formId","ts");

      CREATE TABLE IF NOT EXISTS form_metrics_daily (
        "companyId" uuid NOT NULL,
        "formId" uuid NOT NULL,
        "date" date NOT NULL,
        eligibles int NULL,
        impressions int NOT NULL DEFAULT 0,
        opens int NOT NULL DEFAULT 0,
        starts int NOT NULL DEFAULT 0,
        submits int NOT NULL DEFAULT 0,
        "onTimeSubmits" int NOT NULL DEFAULT 0,
        "internalSubmits" int NOT NULL DEFAULT 0,
        "externalSubmits" int NOT NULL DEFAULT 0,
        "pushSent" int NOT NULL DEFAULT 0,
        "pushOpened" int NOT NULL DEFAULT 0,
        "emailSent" int NOT NULL DEFAULT 0,
        "emailOpened" int NOT NULL DEFAULT 0,
        "emailClicked" int NOT NULL DEFAULT 0,
        PRIMARY KEY ("companyId","formId","date")
      );
      CREATE INDEX IF NOT EXISTS idx_form_metrics_daily_company_form_date ON form_metrics_daily("companyId","formId","date");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS form_metrics_daily;
      DROP TABLE IF EXISTS form_event;
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS form_rh_action;
      DROP TABLE IF EXISTS form_attachment;
      DROP TABLE IF EXISTS form_answer;
      DROP TABLE IF EXISTS form_submission;
      DROP TABLE IF EXISTS form_field;
      DROP TABLE IF EXISTS form;
      DROP TYPE IF EXISTS form_rh_action_type;
      DROP TYPE IF EXISTS form_submission_status;
      DROP TYPE IF EXISTS form_field_type;
      DROP TYPE IF EXISTS form_status;
    `);
  }
}
