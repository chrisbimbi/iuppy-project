
import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateFormMetricsDaily1770281000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "form_metrics_daily",
            columns: [
                { name: "companyId", type: "uuid", isPrimary: true },
                { name: "formId", type: "uuid", isPrimary: true },
                { name: "date", type: "date", isPrimary: true },
                { name: "eligibles", type: "int", isNullable: true, default: 0 },
                { name: "impressions", type: "int", default: 0 },
                { name: "opens", type: "int", default: 0 },
                { name: "starts", type: "int", default: 0 },
                { name: "submits", type: "int", default: 0 },
                { name: "onTimeSubmits", type: "int", default: 0 },
                { name: "internalSubmits", type: "int", default: 0 },
                { name: "externalSubmits", type: "int", default: 0 },
                { name: "pushSent", type: "int", default: 0 },
                { name: "pushOpened", type: "int", default: 0 },
                { name: "emailSent", type: "int", default: 0 },
                { name: "emailOpened", type: "int", default: 0 },
                { name: "emailClicked", type: "int", default: 0 }
            ]
        }), true);

        // Indices already covered by Primary Key (companyId, formId, date) 
        // but explicit indices can be safer for partial lookups if needed.
        // The entity defines @Index(['companyId', 'formId', 'date']) which is consistent.
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("form_metrics_daily");
    }

}
