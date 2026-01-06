import { MigrationInterface, QueryRunner } from "typeorm";

export class AddXpToUser1764619765262 implements MigrationInterface {
    name = 'AddXpToUser1764619765262'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`ALTER TABLE "user_journey_instances" DROP CONSTRAINT "FK_a9d754f2f192c3a472a1c5c452d"`);
        // await queryRunner.query(`ALTER TABLE "user_journey_instances" DROP CONSTRAINT "FK_04bd41d5b061ba103218802e074"`);
        // await queryRunner.query(`ALTER TABLE "step_completions" DROP CONSTRAINT "FK_d3adb9ddacf5b72fb5952c73d6d"`);
        // await queryRunner.query(`ALTER TABLE "step_completions" DROP CONSTRAINT "FK_b72ec776469d448880f05390552"`);
        // await queryRunner.query(`ALTER TABLE "step_completions" DROP COLUMN "pointsAwarded"`);
        // await queryRunner.query(`ALTER TABLE "step_completions" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "xp" integer NOT NULL DEFAULT '0'`);
        // await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "conditions" SET DEFAULT ARRAY[]::text[]`);
        // await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "adminIds" SET DEFAULT ARRAY[]::text[]`);
        // await queryRunner.query(`ALTER TABLE "user_entity" ALTER COLUMN "groups" SET DEFAULT ARRAY[]::text[]`);
        // await queryRunner.query(`ALTER TABLE "space" ALTER COLUMN "distributionChannels" SET DEFAULT ARRAY['app']`);
        // await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "spaceIds" SET DEFAULT ARRAY[]::text[]`);
        // await queryRunner.query(`ALTER TYPE "public"."survey_visibility_enum" RENAME TO "survey_visibility_enum_old"`);
        // await queryRunner.query(`CREATE TYPE "public"."survey_visibility_enum" AS ENUM('public', 'private', 'specific_groups', 'journey_only')`);
        // await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "visibility" DROP DEFAULT`);
        // await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "visibility" TYPE "public"."survey_visibility_enum" USING "visibility"::"text"::"public"."survey_visibility_enum"`);
        // await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "visibility" SET DEFAULT 'public'`);
        // await queryRunner.query(`DROP TYPE "public"."survey_visibility_enum_old"`);
        // await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "groupIds" SET DEFAULT ARRAY[]::text[]`);
        // await queryRunner.query(`ALTER TYPE "public"."journey_steps_contenttype_enum" RENAME TO "journey_steps_contenttype_enum_old"`);
        // await queryRunner.query(`CREATE TYPE "public"."journey_steps_contenttype_enum" AS ENUM('ARTICLE', 'VIDEO', 'QUIZ', 'POLL', 'FORM')`);
        // await queryRunner.query(`ALTER TABLE "journey_steps" ALTER COLUMN "contentType" TYPE "public"."journey_steps_contenttype_enum" USING "contentType"::"text"::"public"."journey_steps_contenttype_enum"`);
        // await queryRunner.query(`DROP TYPE "public"."journey_steps_contenttype_enum_old"`);
        // await queryRunner.query(`ALTER TABLE "journey_steps" DROP COLUMN "mediaType"`);
        // await queryRunner.query(`CREATE TYPE "public"."journey_steps_mediatype_enum" AS ENUM('NONE', 'IMAGE', 'VIDEO', 'DOCUMENT')`);
        // await queryRunner.query(`ALTER TABLE "journey_steps" ADD "mediaType" "public"."journey_steps_mediatype_enum" NOT NULL DEFAULT 'NONE'`);
        // await queryRunner.query(`ALTER TABLE "journey_steps" ALTER COLUMN "requireAck" SET NOT NULL`);
        // await queryRunner.query(`ALTER TABLE "journey_steps" DROP COLUMN "linkedFormId"`);
        // await queryRunner.query(`ALTER TABLE "journey_steps" ADD "linkedFormId" character varying`);
        // await queryRunner.query(`ALTER TABLE "journey_steps" DROP COLUMN "linkedPollId"`);
        // await queryRunner.query(`ALTER TABLE "journey_steps" ADD "linkedPollId" character varying`);
        // await queryRunner.query(`ALTER TABLE "journeys" ALTER COLUMN "triggerType" SET DEFAULT 'MANUAL'`);
        // await queryRunner.query(`ALTER TABLE "user_journey_instances" DROP COLUMN "companyId"`);
        // await queryRunner.query(`ALTER TABLE "user_journey_instances" ADD "companyId" character varying NOT NULL`);
        // await queryRunner.query(`ALTER TABLE "user_journey_instances" DROP COLUMN "userId"`);
        // await queryRunner.query(`ALTER TABLE "user_journey_instances" ADD "userId" character varying NOT NULL`);
        // await queryRunner.query(`ALTER TABLE "user_journey_instances" DROP COLUMN "startDate"`);
        // await queryRunner.query(`ALTER TABLE "user_journey_instances" ADD "startDate" TIMESTAMP NOT NULL`);
        // await queryRunner.query(`ALTER TABLE "user_journey_instances" ALTER COLUMN "currentStep" SET NOT NULL`);
        // await queryRunner.query(`ALTER TABLE "user_journey_instances" DROP COLUMN "completedAt"`);
        // await queryRunner.query(`ALTER TABLE "user_journey_instances" ADD "completedAt" TIMESTAMP`);
        // await queryRunner.query(`ALTER TABLE "step_completions" DROP COLUMN "completedAt"`);
        // await queryRunner.query(`ALTER TABLE "step_completions" ADD "completedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        // await queryRunner.query(`ALTER TABLE "user_journey_instances" ADD CONSTRAINT "FK_04bd41d5b061ba103218802e074" FOREIGN KEY ("journeyId") REFERENCES "journeys"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE "step_completions" ADD CONSTRAINT "FK_d3adb9ddacf5b72fb5952c73d6d" FOREIGN KEY ("instanceId") REFERENCES "user_journey_instances"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE "step_completions" ADD CONSTRAINT "FK_b72ec776469d448880f05390552" FOREIGN KEY ("stepId") REFERENCES "journey_steps"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "step_completions" DROP CONSTRAINT "FK_b72ec776469d448880f05390552"`);
        await queryRunner.query(`ALTER TABLE "step_completions" DROP CONSTRAINT "FK_d3adb9ddacf5b72fb5952c73d6d"`);
        await queryRunner.query(`ALTER TABLE "user_journey_instances" DROP CONSTRAINT "FK_04bd41d5b061ba103218802e074"`);
        await queryRunner.query(`ALTER TABLE "step_completions" DROP COLUMN "completedAt"`);
        await queryRunner.query(`ALTER TABLE "step_completions" ADD "completedAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_journey_instances" DROP COLUMN "completedAt"`);
        await queryRunner.query(`ALTER TABLE "user_journey_instances" ADD "completedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "user_journey_instances" ALTER COLUMN "currentStep" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_journey_instances" DROP COLUMN "startDate"`);
        await queryRunner.query(`ALTER TABLE "user_journey_instances" ADD "startDate" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_journey_instances" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "user_journey_instances" ADD "userId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_journey_instances" DROP COLUMN "companyId"`);
        await queryRunner.query(`ALTER TABLE "user_journey_instances" ADD "companyId" uuid`);
        await queryRunner.query(`ALTER TABLE "journeys" ALTER COLUMN "triggerType" SET DEFAULT 'GLOBAL'`);
        await queryRunner.query(`ALTER TABLE "journey_steps" DROP COLUMN "linkedPollId"`);
        await queryRunner.query(`ALTER TABLE "journey_steps" ADD "linkedPollId" uuid`);
        await queryRunner.query(`ALTER TABLE "journey_steps" DROP COLUMN "linkedFormId"`);
        await queryRunner.query(`ALTER TABLE "journey_steps" ADD "linkedFormId" uuid`);
        await queryRunner.query(`ALTER TABLE "journey_steps" ALTER COLUMN "requireAck" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "journey_steps" DROP COLUMN "mediaType"`);
        await queryRunner.query(`DROP TYPE "public"."journey_steps_mediatype_enum"`);
        await queryRunner.query(`ALTER TABLE "journey_steps" ADD "mediaType" character varying`);
        await queryRunner.query(`CREATE TYPE "public"."journey_steps_contenttype_enum_old" AS ENUM('ARTICLE', 'VIDEO', 'QUIZ')`);
        await queryRunner.query(`ALTER TABLE "journey_steps" ALTER COLUMN "contentType" TYPE "public"."journey_steps_contenttype_enum_old" USING "contentType"::"text"::"public"."journey_steps_contenttype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."journey_steps_contenttype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."journey_steps_contenttype_enum_old" RENAME TO "journey_steps_contenttype_enum"`);
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "groupIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`CREATE TYPE "public"."survey_visibility_enum_old" AS ENUM('public', 'private', 'specific_groups')`);
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "visibility" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "visibility" TYPE "public"."survey_visibility_enum_old" USING "visibility"::"text"::"public"."survey_visibility_enum_old"`);
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "visibility" SET DEFAULT 'public'`);
        await queryRunner.query(`DROP TYPE "public"."survey_visibility_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."survey_visibility_enum_old" RENAME TO "survey_visibility_enum"`);
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "spaceIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "space" ALTER COLUMN "distributionChannels" SET DEFAULT ARRAY['app'`);
        await queryRunner.query(`ALTER TABLE "user_entity" ALTER COLUMN "groups" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "adminIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "conditions" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "xp"`);
        await queryRunner.query(`ALTER TABLE "step_completions" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "step_completions" ADD "pointsAwarded" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "step_completions" ADD CONSTRAINT "FK_b72ec776469d448880f05390552" FOREIGN KEY ("stepId") REFERENCES "journey_steps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "step_completions" ADD CONSTRAINT "FK_d3adb9ddacf5b72fb5952c73d6d" FOREIGN KEY ("instanceId") REFERENCES "user_journey_instances"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_journey_instances" ADD CONSTRAINT "FK_04bd41d5b061ba103218802e074" FOREIGN KEY ("journeyId") REFERENCES "journeys"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_journey_instances" ADD CONSTRAINT "FK_a9d754f2f192c3a472a1c5c452d" FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
