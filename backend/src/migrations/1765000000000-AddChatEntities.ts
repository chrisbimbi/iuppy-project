import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatEntities1765000000000 implements MigrationInterface {
    name = 'AddChatEntities1765000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enums
        await queryRunner.query(`CREATE TYPE "public"."chat_conversation_type_enum" AS ENUM('DIRECT', 'GROUP')`);
        await queryRunner.query(`CREATE TYPE "public"."chat_participant_role_enum" AS ENUM('ADMIN', 'MEMBER')`);
        await queryRunner.query(`CREATE TYPE "public"."chat_message_type_enum" AS ENUM('TEXT', 'IMAGE', 'VOICE', 'FILE', 'SYSTEM')`);

        // Chat Conversation
        await queryRunner.query(`
            CREATE TABLE "chat_conversation" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" "public"."chat_conversation_type_enum" NOT NULL DEFAULT 'DIRECT',
                "name" character varying,
                "avatarUrl" character varying,
                "linkedGroupId" uuid, -- New column
                "lastMessageAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_chat_conversation" PRIMARY KEY ("id")
            )
        `);

        // ... participants ...

        // NEW: Update GroupEntity (user_group table assumed existing)
        // Check if column exists first to be safe or just add it if we know schema
        await queryRunner.query(`ALTER TABLE "user_group" ADD COLUMN IF NOT EXISTS "isChatEnabled" boolean DEFAULT false`);

        // Chat Participant
        await queryRunner.query(`
            CREATE TABLE "chat_participant" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "conversationId" uuid NOT NULL,
                "userId" character varying NOT NULL,
                "role" "public"."chat_participant_role_enum" NOT NULL DEFAULT 'MEMBER',
                "lastReadAt" TIMESTAMP,
                "isArchived" boolean NOT NULL DEFAULT false,
                "isMuted" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_chat_participant" PRIMARY KEY ("id")
            )
        `);

        // Chat Message
        await queryRunner.query(`
            CREATE TABLE "chat_message" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "conversationId" uuid NOT NULL,
                "senderId" character varying NOT NULL,
                "type" "public"."chat_message_type_enum" NOT NULL DEFAULT 'TEXT',
                "content" text,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                CONSTRAINT "PK_chat_message" PRIMARY KEY ("id")
            )
        `);

        // Chat Message Reaction
        await queryRunner.query(`
            CREATE TABLE "chat_message_reaction" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "messageId" uuid NOT NULL,
                "userId" character varying NOT NULL,
                "reaction" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_chat_message_reaction" PRIMARY KEY ("id")
            )
        `);

        // Foreign Keys
        await queryRunner.query(`
            ALTER TABLE "chat_participant" 
            ADD CONSTRAINT "FK_chat_participant_conversation" 
            FOREIGN KEY ("conversationId") REFERENCES "chat_conversation"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_message" 
            ADD CONSTRAINT "FK_chat_message_conversation" 
            FOREIGN KEY ("conversationId") REFERENCES "chat_conversation"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_message_reaction" 
            ADD CONSTRAINT "FK_chat_message_reaction_message" 
            FOREIGN KEY ("messageId") REFERENCES "chat_message"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_message_reaction" DROP CONSTRAINT "FK_chat_message_reaction_message"`);
        await queryRunner.query(`ALTER TABLE "chat_message" DROP CONSTRAINT "FK_chat_message_conversation"`);
        await queryRunner.query(`ALTER TABLE "chat_participant" DROP CONSTRAINT "FK_chat_participant_conversation"`);

        await queryRunner.query(`DROP TABLE "chat_message_reaction"`);
        await queryRunner.query(`DROP TABLE "chat_message"`);
        await queryRunner.query(`DROP TABLE "chat_participant"`);
        await queryRunner.query(`DROP TABLE "chat_conversation"`);

        await queryRunner.query(`DROP TYPE "public"."chat_message_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."chat_participant_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."chat_conversation_type_enum"`);
    }
}
