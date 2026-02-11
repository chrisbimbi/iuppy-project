
import { MigrationInterface, QueryRunner } from 'typeorm';

export class JourneysInit1764263900702 implements MigrationInterface {
  name = 'JourneysInit1764263900702';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "companies" ("id" uuid NOT NULL, "name" character varying NOT NULL, "logo" character varying, "description" text, CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`,
    );

    // Safe Enum Creation 1
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."journeys_triggertype_enum" AS ENUM('GLOBAL', 'GROUP');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Safe Enum Creation 2
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."journeys_restartpolicy_enum" AS ENUM('RESUME', 'RESTART');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "journeys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" uuid NOT NULL, "spaceId" character varying, "title" character varying NOT NULL, "description" character varying, "triggerType" "public"."journeys_triggertype_enum" NOT NULL DEFAULT 'GLOBAL', "targetGroupId" character varying, "restartPolicy" "public"."journeys_restartpolicy_enum" NOT NULL DEFAULT 'RESUME', "active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_94b31b067846c92b6811046c81e" PRIMARY KEY ("id"))`,
    );

    // Safe Enum Creation 3
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."journey_steps_contenttype_enum" AS ENUM('ARTICLE', 'VIDEO', 'QUIZ', 'POLL', 'FORM');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "journey_steps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "journeyId" uuid NOT NULL, "title" character varying NOT NULL, "delayDays" integer NOT NULL DEFAULT '0', "releaseTime" TIME, "contentType" "public"."journey_steps_contenttype_enum" NOT NULL, "contentPayload" jsonb, "orderIndex" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f9606bd8b186289294f39c81ed2" PRIMARY KEY ("id"))`,
    );

    // Safe Enum Creation 4
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."user_journey_instances_status_enum" AS ENUM('ACTIVE', 'COMPLETED', 'DROPPED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "user_journey_instances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "journeyId" uuid NOT NULL, "startDate" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."user_journey_instances_status_enum" NOT NULL DEFAULT 'ACTIVE', "completedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e91e22d39de67dee888168b1620" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "step_completions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "instanceId" uuid NOT NULL, "stepId" uuid NOT NULL, "completedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "pointsAwarded" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_945abc5b2504188e4a14aa45b9a" PRIMARY KEY ("id"))`,
    );

    // Constraints (try/catch usually ok for constraints if IF NOT EXISTS supported or just rely on fail)
    // But since these are FKs, if they exist it fails. But standard TypeORM migrations usually fail if already exists.
    // Assuming migration didn't run fully, so connections likely don't exist.
    // If they do, we might need similar checks. But let's assume constraints are created atomically with table usually, or distinct.
    // Since we created tables with IF NOT EXISTS, we might have skipped table creation but still try to add constraint.
    // Adding checking for constraints is harder in raw SQL.
    // Let's try wrapping them too or checking existence.
    // Simplest is to drop constraint if exists and re-add, or just catch error.
    // But 'current transaction aborted' issue persists.
    // So we use DO block.

    const addConstraint = async (table: string, constraint: string, sql: string) => {
      await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}" ${sql};
            EXCEPTION
                WHEN duplicate_object THEN null;
                WHEN duplicate_table THEN null; -- for constraints sometimes
            END $$;
        `);
    };

    // Since I can't easily refactor to helper function inside `up` cleanly without redefining, I'll inline.

    await queryRunner.query(`
        DO $$ BEGIN
            ALTER TABLE "journeys" ADD CONSTRAINT "FK_03b4beed0a31372003de6554a62" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
        DO $$ BEGIN
            ALTER TABLE "journey_steps" ADD CONSTRAINT "FK_953a29cd3ce6b7531af29520b96" FOREIGN KEY ("journeyId") REFERENCES "journeys"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
        DO $$ BEGIN
            ALTER TABLE "user_journey_instances" ADD CONSTRAINT "FK_a9d754f2f192c3a472a1c5c452d" FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
        DO $$ BEGIN
            ALTER TABLE "user_journey_instances" ADD CONSTRAINT "FK_04bd41d5b061ba103218802e074" FOREIGN KEY ("journeyId") REFERENCES "journeys"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
        DO $$ BEGIN
            ALTER TABLE "step_completions" ADD CONSTRAINT "FK_d3adb9ddacf5b72fb5952c73d6d" FOREIGN KEY ("instanceId") REFERENCES "user_journey_instances"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
        DO $$ BEGIN
            ALTER TABLE "step_completions" ADD CONSTRAINT "FK_b72ec776469d448880f05390552" FOREIGN KEY ("stepId") REFERENCES "journey_steps"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // We can leave down as is or empty if we don't plan to revert in dev
  }
}
