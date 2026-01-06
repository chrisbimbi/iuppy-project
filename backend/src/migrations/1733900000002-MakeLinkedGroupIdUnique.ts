import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeLinkedGroupIdUnique1733900000002 implements MigrationInterface {
    name = 'MakeLinkedGroupIdUnique1733900000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_conversation" ADD CONSTRAINT "UQ_linkedGroupId" UNIQUE ("linkedGroupId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_conversation" DROP CONSTRAINT "UQ_linkedGroupId"`);
    }
}
