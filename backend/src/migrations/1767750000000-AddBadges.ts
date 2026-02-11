
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBadges1767750000000 implements MigrationInterface {
    name = 'AddBadges1767750000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Badge Table
        await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."gamification_badge_ruletype_enum" AS ENUM('XP_THRESHOLD', 'NEWS_READ_COUNT', 'SURVEY_COUNT', 'JOURNEY_STEP_COUNT', 'MANUAL'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "gamification_badge" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "slug" character varying NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying,
                "iconUrl" character varying,
                "ruleType" "public"."gamification_badge_ruletype_enum" NOT NULL DEFAULT 'MANUAL',
                "ruleValue" integer NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_badge_slug" UNIQUE ("slug"),
                CONSTRAINT "PK_gamification_badge" PRIMARY KEY ("id")
            )
        `);

        // User Badge Table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_badge" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "badgeId" uuid NOT NULL,
                "awardedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_badge" PRIMARY KEY ("id")
            )
        `);

        // Indexes
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_badge_unique" ON "user_badge" ("userId", "badgeId")
        `);

        // FKs
        await queryRunner.query(`DO $$ BEGIN ALTER TABLE "user_badge" ADD CONSTRAINT "FK_user_badge_userId" FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object THEN null; WHEN duplicate_table THEN null; END $$;`);

        await queryRunner.query(`DO $$ BEGIN ALTER TABLE "user_badge" ADD CONSTRAINT "FK_user_badge_badgeId" FOREIGN KEY ("badgeId") REFERENCES "gamification_badge"("id") ON DELETE CASCADE ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object THEN null; WHEN duplicate_table THEN null; END $$;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_badge" DROP CONSTRAINT IF EXISTS "FK_user_badge_badgeId"`);
        await queryRunner.query(`ALTER TABLE "user_badge" DROP CONSTRAINT IF EXISTS "FK_user_badge_userId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_user_badge_unique"`);
        await queryRunner.query(`DROP TABLE "user_badge"`);
        await queryRunner.query(`DROP TABLE "gamification_badge"`);
        await queryRunner.query(`DROP TYPE "public"."gamification_badge_ruletype_enum"`);
    }

}
