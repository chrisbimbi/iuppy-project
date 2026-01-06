import { MigrationInterface, QueryRunner } from 'typeorm';

export class JourneysInit1764263900702 implements MigrationInterface {
  name = 'JourneysInit1764263900702';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "companies" ("id" uuid NOT NULL, "name" character varying NOT NULL, "logo" character varying, "description" text, CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."journeys_triggertype_enum" AS ENUM('GLOBAL', 'GROUP')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."journeys_restartpolicy_enum" AS ENUM('RESUME', 'RESTART')`,
    );
    await queryRunner.query(
      `CREATE TABLE "journeys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" uuid NOT NULL, "spaceId" character varying, "title" character varying NOT NULL, "description" character varying, "triggerType" "public"."journeys_triggertype_enum" NOT NULL DEFAULT 'GLOBAL', "targetGroupId" character varying, "restartPolicy" "public"."journeys_restartpolicy_enum" NOT NULL DEFAULT 'RESUME', "active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_94b31b067846c92b6811046c81e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."journey_steps_contenttype_enum" AS ENUM('ARTICLE', 'VIDEO', 'QUIZ')`,
    );
    await queryRunner.query(
      `CREATE TABLE "journey_steps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "journeyId" uuid NOT NULL, "title" character varying NOT NULL, "delayDays" integer NOT NULL DEFAULT '0', "releaseTime" TIME, "contentType" "public"."journey_steps_contenttype_enum" NOT NULL, "contentPayload" jsonb, "orderIndex" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f9606bd8b186289294f39c81ed2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_journey_instances_status_enum" AS ENUM('ACTIVE', 'COMPLETED', 'DROPPED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_journey_instances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "journeyId" uuid NOT NULL, "startDate" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."user_journey_instances_status_enum" NOT NULL DEFAULT 'ACTIVE', "completedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e91e22d39de67dee888168b1620" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "step_completions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "instanceId" uuid NOT NULL, "stepId" uuid NOT NULL, "completedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "pointsAwarded" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_945abc5b2504188e4a14aa45b9a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "journeys" ADD CONSTRAINT "FK_03b4beed0a31372003de6554a62" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "journey_steps" ADD CONSTRAINT "FK_953a29cd3ce6b7531af29520b96" FOREIGN KEY ("journeyId") REFERENCES "journeys"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_journey_instances" ADD CONSTRAINT "FK_a9d754f2f192c3a472a1c5c452d" FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_journey_instances" ADD CONSTRAINT "FK_04bd41d5b061ba103218802e074" FOREIGN KEY ("journeyId") REFERENCES "journeys"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "step_completions" ADD CONSTRAINT "FK_d3adb9ddacf5b72fb5952c73d6d" FOREIGN KEY ("instanceId") REFERENCES "user_journey_instances"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "step_completions" ADD CONSTRAINT "FK_b72ec776469d448880f05390552" FOREIGN KEY ("stepId") REFERENCES "journey_steps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "step_completions" DROP CONSTRAINT "FK_b72ec776469d448880f05390552"`,
    );
    await queryRunner.query(
      `ALTER TABLE "step_completions" DROP CONSTRAINT "FK_d3adb9ddacf5b72fb5952c73d6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_journey_instances" DROP CONSTRAINT "FK_04bd41d5b061ba103218802e074"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_journey_instances" DROP CONSTRAINT "FK_a9d754f2f192c3a472a1c5c452d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journey_steps" DROP CONSTRAINT "FK_953a29cd3ce6b7531af29520b96"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journeys" DROP CONSTRAINT "FK_03b4beed0a31372003de6554a62"`,
    );
    await queryRunner.query(`DROP TABLE "step_completions"`);
    await queryRunner.query(`DROP TABLE "user_journey_instances"`);
    await queryRunner.query(
      `DROP TYPE "public"."user_journey_instances_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "journey_steps"`);
    await queryRunner.query(
      `DROP TYPE "public"."journey_steps_contenttype_enum"`,
    );
    await queryRunner.query(`DROP TABLE "journeys"`);
    await queryRunner.query(`DROP TYPE "public"."journeys_restartpolicy_enum"`);
    await queryRunner.query(`DROP TYPE "public"."journeys_triggertype_enum"`);
    await queryRunner.query(`DROP TABLE "companies"`);
  }
}
