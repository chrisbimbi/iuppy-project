import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAiColumnsToNews1766007000000 implements MigrationInterface {
    name = 'AddAiColumnsToNews1766007000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add AI-related columns to news_entity
        // using float[] for embeddings to be database-agnostic enough (or mapped to vector later)

        await queryRunner.query(`ALTER TABLE "news_entity" ADD COLUMN IF NOT EXISTS "embedding" double precision[]`);
        await queryRunner.query(`ALTER TABLE "news_entity" ADD COLUMN IF NOT EXISTS "sentiment_score" double precision`);
        await queryRunner.query(`ALTER TABLE "news_entity" ADD COLUMN IF NOT EXISTS "sentiment_label" character varying`);
        await queryRunner.query(`ALTER TABLE "news_entity" ADD COLUMN IF NOT EXISTS "ai_summary" text`);
        await queryRunner.query(`ALTER TABLE "news_entity" ADD COLUMN IF NOT EXISTS "ai_tags" text array`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "news_entity" DROP COLUMN IF EXISTS "ai_tags"`);
        await queryRunner.query(`ALTER TABLE "news_entity" DROP COLUMN IF EXISTS "ai_summary"`);
        await queryRunner.query(`ALTER TABLE "news_entity" DROP COLUMN IF EXISTS "sentiment_label"`);
        await queryRunner.query(`ALTER TABLE "news_entity" DROP COLUMN IF EXISTS "sentiment_score"`);
        await queryRunner.query(`ALTER TABLE "news_entity" DROP COLUMN IF EXISTS "embedding"`);
    }
}
