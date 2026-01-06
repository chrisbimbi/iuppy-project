import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddChatFeatures1733857000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add 'reactions' JSONB column
        // We check if it exists first to be safe, though usually migration shouldn't exist
        const table = await queryRunner.getTable("chat_message");
        if (!table.findColumnByName("reactions")) {
            await queryRunner.addColumn("chat_message", new TableColumn({
                name: "reactions",
                type: "jsonb",
                isNullable: true,
                default: "'{}'"
            }));
        }

        // 2. Add 'replyToId' UUID column
        if (!table.findColumnByName("replyToId")) {
            await queryRunner.addColumn("chat_message", new TableColumn({
                name: "replyToId",
                type: "uuid",
                isNullable: true,
            }));

            // FK
            await queryRunner.createForeignKey("chat_message", new TableForeignKey({
                columnNames: ["replyToId"],
                referencedColumnNames: ["id"],
                referencedTableName: "chat_message",
                onDelete: "SET NULL"
            }));
        }

        // 3. Add 'replySnapshot' JSONB column
        if (!table.findColumnByName("replySnapshot")) {
            await queryRunner.addColumn("chat_message", new TableColumn({
                name: "replySnapshot",
                type: "jsonb",
                isNullable: true,
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("chat_message");

        if (table.findColumnByName("replyToId")) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("replyToId") !== -1);
            if (foreignKey) await queryRunner.dropForeignKey("chat_message", foreignKey);
            await queryRunner.dropColumn("chat_message", "replyToId");
        }

        if (table.findColumnByName("replySnapshot")) {
            await queryRunner.dropColumn("chat_message", "replySnapshot");
        }

        if (table.findColumnByName("reactions")) {
            await queryRunner.dropColumn("chat_message", "reactions");
        }
    }

}
