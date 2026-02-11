import { MigrationInterface, QueryRunner } from "typeorm";

export class GamificationFields1767796273359 implements MigrationInterface {
    name = 'GamificationFields1767796273359'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Only adding the missing columns causing 500 error
        // Safety check to avoid error if they exist? TypeORM migrations usually assume consistency.
        // But since this file was generated based on diff, it means they are missing.
        
        // Wrap in try-catch or just run. Assuming strict migration flow:
        // Check if column exists is hard in raw SQL generic.
        // TypeORM `ADD COLUMN IF NOT EXISTS` is Postgres clean.
        
        await queryRunner.query(`ALTER TABLE "news_entity" ADD IF NOT EXISTS "xpOverride" integer`);
        await queryRunner.query(`ALTER TABLE "journey_steps" ADD IF NOT EXISTS "xpOverride" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "news_entity" DROP COLUMN IF EXISTS "xpOverride"`);
        await queryRunner.query(`ALTER TABLE "journey_steps" DROP COLUMN IF EXISTS "xpOverride"`);
    }

}
