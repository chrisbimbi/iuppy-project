import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVacationsAndPerformance1765417069478 implements MigrationInterface {
    name = 'AddVacationsAndPerformance1765417069478'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // REMOVED UNRELATED CHAT DROPS
        await queryRunner.query(`CREATE TABLE "vacation_policies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" character varying NOT NULL, "name" character varying NOT NULL, "minDaysAntecedence" integer NOT NULL DEFAULT '30', "allowFractioning" boolean NOT NULL DEFAULT true, "maxPeriods" integer NOT NULL DEFAULT '3', "minDaysPerPeriod" jsonb NOT NULL DEFAULT '{}', "allowCashAllowance" boolean NOT NULL DEFAULT true, "allow13thAdvance" boolean NOT NULL DEFAULT true, "accrualLogic" character varying NOT NULL DEFAULT 'standard', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ad32ad79afca71d72a44146835a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vacation_balances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "periodStart" date NOT NULL, "periodEnd" date NOT NULL, "concessiveLimitDate" date NOT NULL, "daysVested" integer NOT NULL DEFAULT '0', "daysTaken" integer NOT NULL DEFAULT '0', "daysSold" integer NOT NULL DEFAULT '0', "balanceTotal" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4112a484892b92928b635065d90" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0ce270e84ca6bc58f707fe96de" ON "vacation_balances" ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."vacation_requests_type_enum" AS ENUM('INDIVIDUAL', 'COLLECTIVE')`);
        await queryRunner.query(`CREATE TYPE "public"."vacation_requests_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELED', 'COMPLETED', 'PROCESSING')`);
        await queryRunner.query(`CREATE TABLE "vacation_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "soldDays" integer NOT NULL DEFAULT '0', "request13th" boolean NOT NULL DEFAULT false, "type" "public"."vacation_requests_type_enum" NOT NULL DEFAULT 'INDIVIDUAL', "status" "public"."vacation_requests_status_enum" NOT NULL DEFAULT 'PENDING', "approvalFlowSnapshot" jsonb, "rejectionReason" text, "attachmentUrl" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e8ca8afb59b9a4350c339b66843" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7f834c38260aba3409c9bdb7b1" ON "vacation_requests" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_0599c957d6d52b2315b7bda159" ON "vacation_requests" ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."performance_cycles_status_enum" AS ENUM('SETUP', 'ACTIVE', 'CALIBRATION', 'CLOSED')`);
        await queryRunner.query(`CREATE TABLE "performance_cycles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "status" "public"."performance_cycles_status_enum" NOT NULL DEFAULT 'SETUP', "participantsFilter" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_399ac4b3f00cb66c2802c9be882" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."assessment_forms_type_enum" AS ENUM('SELF', 'MANAGER', 'PEER')`);
        await queryRunner.query(`CREATE TYPE "public"."assessment_forms_status_enum" AS ENUM('PENDING', 'SUBMITTED')`);
        await queryRunner.query(`CREATE TABLE "assessment_forms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cycleId" uuid NOT NULL, "targetUserId" uuid NOT NULL, "evaluatorUserId" uuid NOT NULL, "type" "public"."assessment_forms_type_enum" NOT NULL, "status" "public"."assessment_forms_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7f956e9131b231de58267c5ee9f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7d57739df9e0f9bee6a46eadf7" ON "assessment_forms" ("evaluatorUserId") `);
        await queryRunner.query(`CREATE INDEX "IDX_bb10e77130adb03b2661a7f46f" ON "assessment_forms" ("targetUserId") `);
        await queryRunner.query(`CREATE INDEX "IDX_88d5d7872c0225fbabb126ec18" ON "assessment_forms" ("cycleId") `);
        await queryRunner.query(`CREATE TYPE "public"."goals_type_enum" AS ENUM('COMPANY', 'TEAM', 'INDIVIDUAL')`);
        await queryRunner.query(`CREATE TABLE "goals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "parentGoalId" uuid, "title" character varying NOT NULL, "weight" integer NOT NULL DEFAULT '0', "progress" integer NOT NULL DEFAULT '0', "type" "public"."goals_type_enum" NOT NULL DEFAULT 'INDIVIDUAL', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_26e17b251afab35580dff769223" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_57dd8a3fc26eb760d076bf8840" ON "goals" ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."pdis_status_enum" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED')`);
        await queryRunner.query(`CREATE TABLE "pdis" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "title" character varying NOT NULL, "status" "public"."pdis_status_enum" NOT NULL DEFAULT 'NOT_STARTED', "deadline" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5cce4fcbab34c5ae3b7d83410fd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3b800245235290c44281bf0d62" ON "pdis" ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."pdi_actions_status_enum" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED')`);
        await queryRunner.query(`CREATE TABLE "pdi_actions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pdiId" uuid NOT NULL, "description" character varying NOT NULL, "dueDate" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."pdi_actions_status_enum" NOT NULL DEFAULT 'NOT_STARTED', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_400500ddf79d5098f572f2c0c9f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_003589d5c3b179bc9dc991b746" ON "pdi_actions" ("pdiId") `);
        await queryRunner.query(`CREATE TABLE "one_on_ones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "managerId" uuid NOT NULL, "employeeId" uuid NOT NULL, "date" TIMESTAMP WITH TIME ZONE NOT NULL, "talkingPoints" jsonb NOT NULL DEFAULT '{}', "privateNotes" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_335c0b977f84ab3f07264d2898f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b11c9c710cf1a552d5de156329" ON "one_on_ones" ("employeeId") `);
        await queryRunner.query(`CREATE INDEX "IDX_38bff4c45d32b0a3b8e9e83e6f" ON "one_on_ones" ("managerId") `);
        // REMOVED DANGEROUS ALTERS (News, Channel, Survey, etc)
        await queryRunner.query(`ALTER TABLE "vacation_balances" ADD CONSTRAINT "FK_0ce270e84ca6bc58f707fe96de0" FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vacation_requests" ADD CONSTRAINT "FK_0599c957d6d52b2315b7bda159c" FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assessment_forms" ADD CONSTRAINT "FK_88d5d7872c0225fbabb126ec188" FOREIGN KEY ("cycleId") REFERENCES "performance_cycles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assessment_forms" ADD CONSTRAINT "FK_bb10e77130adb03b2661a7f46fe" FOREIGN KEY ("targetUserId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assessment_forms" ADD CONSTRAINT "FK_7d57739df9e0f9bee6a46eadf78" FOREIGN KEY ("evaluatorUserId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "goals" ADD CONSTRAINT "FK_57dd8a3fc26eb760d076bf8840e" FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "goals" ADD CONSTRAINT "FK_45db60741e56aa6941b7cf77fde" FOREIGN KEY ("parentGoalId") REFERENCES "goals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pdis" ADD CONSTRAINT "FK_3b800245235290c44281bf0d624" FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pdi_actions" ADD CONSTRAINT "FK_003589d5c3b179bc9dc991b746e" FOREIGN KEY ("pdiId") REFERENCES "pdis"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "one_on_ones" ADD CONSTRAINT "FK_38bff4c45d32b0a3b8e9e83e6f2" FOREIGN KEY ("managerId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "one_on_ones" ADD CONSTRAINT "FK_b11c9c710cf1a552d5de156329c" FOREIGN KEY ("employeeId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "one_on_ones" DROP CONSTRAINT "FK_b11c9c710cf1a552d5de156329c"`);
        await queryRunner.query(`ALTER TABLE "one_on_ones" DROP CONSTRAINT "FK_38bff4c45d32b0a3b8e9e83e6f2"`);
        await queryRunner.query(`ALTER TABLE "pdi_actions" DROP CONSTRAINT "FK_003589d5c3b179bc9dc991b746e"`);
        await queryRunner.query(`ALTER TABLE "pdis" DROP CONSTRAINT "FK_3b800245235290c44281bf0d624"`);
        await queryRunner.query(`ALTER TABLE "goals" DROP CONSTRAINT "FK_45db60741e56aa6941b7cf77fde"`);
        await queryRunner.query(`ALTER TABLE "goals" DROP CONSTRAINT "FK_57dd8a3fc26eb760d076bf8840e"`);
        await queryRunner.query(`ALTER TABLE "assessment_forms" DROP CONSTRAINT "FK_7d57739df9e0f9bee6a46eadf78"`);
        await queryRunner.query(`ALTER TABLE "assessment_forms" DROP CONSTRAINT "FK_bb10e77130adb03b2661a7f46fe"`);
        await queryRunner.query(`ALTER TABLE "assessment_forms" DROP CONSTRAINT "FK_88d5d7872c0225fbabb126ec188"`);
        await queryRunner.query(`ALTER TABLE "vacation_requests" DROP CONSTRAINT "FK_0599c957d6d52b2315b7bda159c"`);
        await queryRunner.query(`ALTER TABLE "vacation_balances" DROP CONSTRAINT "FK_0ce270e84ca6bc58f707fe96de0"`);
        // REMOVED DANGEROUS REVERTS
        await queryRunner.query(`DROP TABLE "one_on_ones"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_003589d5c3b179bc9dc991b746"`);
        await queryRunner.query(`DROP TABLE "pdi_actions"`);
        await queryRunner.query(`DROP TYPE "public"."pdi_actions_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3b800245235290c44281bf0d62"`);
        await queryRunner.query(`DROP TABLE "pdis"`);
        await queryRunner.query(`DROP TYPE "public"."pdis_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_57dd8a3fc26eb760d076bf8840"`);
        await queryRunner.query(`DROP TABLE "goals"`);
        await queryRunner.query(`DROP TYPE "public"."goals_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88d5d7872c0225fbabb126ec18"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bb10e77130adb03b2661a7f46f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d57739df9e0f9bee6a46eadf7"`);
        await queryRunner.query(`DROP TABLE "assessment_forms"`);
        await queryRunner.query(`DROP TYPE "public"."assessment_forms_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."assessment_forms_type_enum"`);
        await queryRunner.query(`DROP TABLE "performance_cycles"`);
        await queryRunner.query(`DROP TYPE "public"."performance_cycles_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0599c957d6d52b2315b7bda159"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7f834c38260aba3409c9bdb7b1"`);
        await queryRunner.query(`DROP TABLE "vacation_requests"`);
        await queryRunner.query(`DROP TYPE "public"."vacation_requests_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."vacation_requests_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0ce270e84ca6bc58f707fe96de"`);
        await queryRunner.query(`DROP TABLE "vacation_balances"`);
        await queryRunner.query(`DROP TABLE "vacation_policies"`);
        // REMOVED UNRELATED CHAT RESTORES
    }

}
