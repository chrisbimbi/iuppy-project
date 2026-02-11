import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateIntegrationConfig1770146515580 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "integration_configs",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "uuid"
                },
                {
                    name: "connection_id",
                    type: "uuid",
                    isUnique: true
                },
                {
                    name: "fieldMapping",
                    type: "jsonb",
                    default: "'{}'"
                },
                {
                    name: "active",
                    type: "boolean",
                    default: true
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "now()"
                },
                {
                    name: "updated_at",
                    type: "timestamp",
                    default: "now()"
                }
            ]
        }), true);



        // --- SEED DEMO DATA ---
        // Ensure provider exists
        await queryRunner.query(`
            INSERT INTO "integration_providers" ("key", "name", "auth_flow", "default_scopes", "api_version")
            VALUES ('azure-ad', 'Microsoft Entra ID', 'oauth2_cc', '["User.Read.All"]', 'v1.0')
            ON CONFLICT ("key") DO NOTHING;
        `);

        // Seed the specific connection expected by the frontend
        await queryRunner.query(`
            INSERT INTO "integration_connections" ("id", "company_id", "provider_key", "status", "base_url", "options", "created_at", "updated_at")
            VALUES 
            ('f207d707-8c30-49b0-a820-d35767ade5af', '2af4557f-9259-4eed-818d-1d0ffe0b8982', 'azure-ad', 'active', 'https://graph.microsoft.com/v1.0', '{"tenantId": "demo"}', now(), now())
            ON CONFLICT ("id") DO NOTHING;
        `);

        await queryRunner.createForeignKey("integration_configs", new TableForeignKey({
            columnNames: ["connection_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "integration_connections",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("integration_configs");
        const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf("connection_id") !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey("integration_configs", foreignKey);
        }
        await queryRunner.dropTable("integration_configs");
    }

}
