import { MigrationInterface, QueryRunner } from "typeorm";

export class FixChatUuidTypes1733900000001 implements MigrationInterface {
    name = 'FixChatUuidTypes1733900000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Fix chat_participant.userId
        await queryRunner.query(`ALTER TABLE "chat_participant" ALTER COLUMN "userId" TYPE uuid USING "userId"::uuid`);

        // Fix chat_message.senderId
        await queryRunner.query(`ALTER TABLE "chat_message" ALTER COLUMN "senderId" TYPE uuid USING "senderId"::uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_message" ALTER COLUMN "senderId" TYPE character varying`);
        await queryRunner.query(`ALTER TABLE "chat_participant" ALTER COLUMN "userId" TYPE character varying`);
    }
}
