import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompanyIdToNewsMetricsDaily1764425000000 implements MigrationInterface {
    name = 'AddCompanyIdToNewsMetricsDaily1764425000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop table if exists to reset schema
        await queryRunner.query(`DROP TABLE IF EXISTS "news_metrics_daily"`);

        // Recreate with companyId
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "news_metrics_daily" (
                "companyId" uuid NOT NULL,
                "newsId" uuid NOT NULL,
                "date" date NOT NULL,
                "opens" integer NOT NULL DEFAULT '0',
                "uniqueOpens" integer NOT NULL DEFAULT '0',
                "acks" integer NOT NULL DEFAULT '0',
                "reactions" integer NOT NULL DEFAULT '0',
                "comments" integer NOT NULL DEFAULT '0',
                "shares" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_news_metrics_daily" PRIMARY KEY ("companyId", "newsId", "date")
            )
        `);

        // Add index
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_news_metrics_daily_newsId_date" ON "news_metrics_daily" ("newsId", "date")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "news_metrics_daily"`);
    }
}
