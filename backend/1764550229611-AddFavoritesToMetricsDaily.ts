import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFavoritesToMetricsDaily1764550229611 implements MigrationInterface {
    name = 'AddFavoritesToMetricsDaily1764550229611'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "news_metrics_daily" ADD "favorites" integer NOT NULL DEFAULT '0'`);
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
        await queryRunner.query(`ALTER TABLE "news_metrics_daily" DROP COLUMN "favorites"`);
    }

}
