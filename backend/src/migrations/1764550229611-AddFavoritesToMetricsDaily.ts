import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFavoritesToMetricsDaily1764550229611 implements MigrationInterface {
    name = 'AddFavoritesToMetricsDaily1764550229611'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "news_metrics_daily" ADD "favorites" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "user_metrics_daily" ADD "favorites" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_metrics_daily" DROP COLUMN "favorites"`);
        await queryRunner.query(`ALTER TABLE "news_metrics_daily" DROP COLUMN "favorites"`);
    }

}
