import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm"

export class AddChatMessageHidden1766009000000 implements MigrationInterface {
    name = 'AddChatMessageHidden1766009000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "chat_message_hidden",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()",
                },
                {
                    name: "userId",
                    type: "character varying", // Matches existing user ID type
                    isNullable: false
                },
                {
                    name: "messageId",
                    type: "uuid", // Messages use UUIDs
                    isNullable: false
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "now()",
                },
            ],
        }), true)

        await queryRunner.createIndex("chat_message_hidden", new TableIndex({
            columnNames: ["userId", "messageId"],
            isUnique: true
        }));

        // Add Foreign Key for messageId just in case, though not strictly required if we want soft loose coupling, 
        // but typically good for integrity. The error 'relation does not exist' was just about the table itself.
        // Given earlier migrations used raw SQL for FKs, I'll stick to basic table creation first.
        // Actually, let's add the FK to fail fast if message doesn't exist.

        await queryRunner.query(`
            ALTER TABLE "chat_message_hidden" 
            ADD CONSTRAINT "FK_chat_message_hidden_message" 
            FOREIGN KEY ("messageId") REFERENCES "chat_message"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_message_hidden" DROP CONSTRAINT "FK_chat_message_hidden_message"`);
        await queryRunner.dropTable("chat_message_hidden");
    }
}
