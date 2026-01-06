import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPushToJourneySteps1764683906343 implements MigrationInterface {
    name = 'AddPushToJourneySteps1764683906343'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "journey_steps" ADD "pushTitle" character varying`);
        await queryRunner.query(`ALTER TABLE "journey_steps" ADD "pushMessage" character varying`);
        await queryRunner.query(`ALTER TABLE "user_journey_instances" ADD "notificationsSent" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "conditions" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "adminIds" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "user_entity" ALTER COLUMN "groups" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "space" ALTER COLUMN "distributionChannels" SET DEFAULT ARRAY['app']`);
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "spaceIds" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "groupIds" SET DEFAULT ARRAY[]::text[]`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "groupIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "spaceIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "space" ALTER COLUMN "distributionChannels" SET DEFAULT ARRAY['app'`);
        await queryRunner.query(`ALTER TABLE "user_entity" ALTER COLUMN "groups" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "adminIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "conditions" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user_journey_instances" DROP COLUMN "notificationsSent"`);
        await queryRunner.query(`ALTER TABLE "journey_steps" DROP COLUMN "pushMessage"`);
        await queryRunner.query(`ALTER TABLE "journey_steps" DROP COLUMN "pushTitle"`);
    }

}
