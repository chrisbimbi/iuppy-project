import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuizConfigToJourneySteps1767985773911 implements MigrationInterface {
    name = 'AddQuizConfigToJourneySteps1767985773911'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "journey_steps" ADD IF NOT EXISTS "quizConfig" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "journey_steps" DROP COLUMN IF EXISTS "quizConfig"`);
    }

}
