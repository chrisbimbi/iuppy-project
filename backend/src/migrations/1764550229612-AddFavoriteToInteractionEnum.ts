import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFavoriteToInteractionEnum1764550229612 implements MigrationInterface {
    name = 'AddFavoriteToInteractionEnum1764550229612'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."news_interaction_event_type_enum" ADD VALUE IF NOT EXISTS 'FAVORITE'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Postgres does not support removing values from ENUM easily
    }

}
