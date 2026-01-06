import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddClearedHistoryAt1733900000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("chat_participant");
        if (!table) return;

        if (!table.findColumnByName("clearedHistoryAt")) {
            await queryRunner.addColumn("chat_participant", new TableColumn({
                name: "clearedHistoryAt",
                type: "timestamp",
                isNullable: true
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("chat_participant");
        if (table && table.findColumnByName("clearedHistoryAt")) {
            await queryRunner.dropColumn("chat_participant", "clearedHistoryAt");
        }
    }

}
