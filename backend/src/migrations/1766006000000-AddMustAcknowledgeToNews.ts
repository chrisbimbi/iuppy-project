import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMustAcknowledgeToNews1766006000000 implements MigrationInterface {
    name = 'AddMustAcknowledgeToNews1766006000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add mustAcknowledge column to news_entity - defaulting to false
        await queryRunner.query(`ALTER TABLE "news_entity" ADD COLUMN IF NOT EXISTS "mustAcknowledge" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "news_entity" DROP COLUMN IF EXISTS "mustAcknowledge"`);
    }
}
