import { MigrationInterface, QueryRunner } from "typeorm";

export class GamificationInit1767749920642 implements MigrationInterface {
    name = 'GamificationInit1767749920642'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_xp_history_actiontype_enum" AS ENUM('JOURNEY_STEP', 'JOURNEY_COMPLETION', 'NEWS_READ', 'SURVEY_COMPLETION', 'SOCIAL_POST', 'SOCIAL_COMMENT', 'SOCIAL_REACTION', 'MANUAL_AWARD', 'PROFILE_UPDATE', 'VIDEO_WATCH', 'FORM_SUBMISSION', 'AGREEMENT_ACCEPT')`);
        await queryRunner.query(`CREATE TABLE "user_xp_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "amount" integer NOT NULL, "actionType" "public"."user_xp_history_actiontype_enum" NOT NULL, "sourceId" text, "description" text, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dd49c30277c2c5cf7dde74d48ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_94b3b7ca35b96e0514d22dc55f" ON "user_xp_history" ("userId", "actionType", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_f36bf45a5971c1fb9ce0494351" ON "user_xp_history" ("userId", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "user_xp_history" ADD CONSTRAINT "FK_8f1eee7a71e48c98e2848c8df16" FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_xp_history" DROP CONSTRAINT "FK_8f1eee7a71e48c98e2848c8df16"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f36bf45a5971c1fb9ce0494351"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_94b3b7ca35b96e0514d22dc55f"`);
        await queryRunner.query(`DROP TABLE "user_xp_history"`);
        await queryRunner.query(`DROP TYPE "public"."user_xp_history_actiontype_enum"`);
    }

}
