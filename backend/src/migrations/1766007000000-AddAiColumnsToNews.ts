import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAiColumnsToNews1766007000000 implements MigrationInterface {
    name = 'AddAiColumnsToNews1766007000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add AI-related columns to news_entity
        // using float[] for embeddings to be database-agnostic enough (or mapped to vector later)

        await queryRunner.query(`ALTER TABLE "news_entity" ADD "embedding" double precision[]`);
        await queryRunner.query(`ALTER TABLE "news_entity" ADD "sentiment_score" double precision`);
        await queryRunner.query(`ALTER TABLE "news_entity" ADD "sentiment_label" character varying`);
        await queryRunner.query(`ALTER TABLE "news_entity" ADD "ai_summary" text`);
        await queryRunner.query(`ALTER TABLE "news_entity" ADD "ai_tags" text array`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "news_entity" DROP COLUMN "ai_tags"`);
        await queryRunner.query(`ALTER TABLE "news_entity" DROP COLUMN "ai_summary"`);
        await queryRunner.query(`ALTER TABLE "news_entity" DROP COLUMN "sentiment_label"`);
        await queryRunner.query(`ALTER TABLE "news_entity" DROP COLUMN "sentiment_score"`);
        await queryRunner.query(`ALTER TABLE "news_entity" DROP COLUMN "embedding"`);
    }
}
