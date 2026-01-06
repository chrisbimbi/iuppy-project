import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewsFavorites1764548912993 implements MigrationInterface {
    name = 'AddNewsFavorites1764548912993'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "news_favorite" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" uuid NOT NULL, "newsId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uniq_user_favorite_news" UNIQUE ("companyId", "newsId", "userId"), CONSTRAINT "PK_f01c312388f4371c56024ca3b6b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ba924b17917c7c1467c3285d74" ON "news_favorite" ("companyId", "userId") `);
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
        await queryRunner.query(`DROP INDEX "public"."IDX_ba924b17917c7c1467c3285d74"`);
        await queryRunner.query(`DROP TABLE "news_favorite"`);
    }

}
