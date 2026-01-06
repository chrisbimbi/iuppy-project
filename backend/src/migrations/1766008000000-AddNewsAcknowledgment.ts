
import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class AddNewsAcknowledgment1766008000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "news_acknowledgment",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()",
                },
                {
                    name: "newsId",
                    type: "uuid",
                    isNullable: false,
                },
                {
                    name: "userId",
                    type: "uuid",
                    isNullable: false,
                },
                {
                    name: "companyId",
                    type: "uuid",
                    isNullable: false,
                },
                {
                    name: "createdAt",
                    type: "timestamptz",
                    default: "now()",
                },
            ],
        }), true);

        // Index for unique check per news/user
        await queryRunner.createIndex("news_acknowledgment", new TableIndex({
            name: "IDX_NEWS_ACK_UNIQUE",
            columnNames: ["newsId", "userId"],
            isUnique: true
        }));

        // Performance indexes
        await queryRunner.createIndex("news_acknowledgment", new TableIndex({
            name: "IDX_NEWS_ACK_NEWS",
            columnNames: ["newsId"]
        }));

        await queryRunner.createIndex("news_acknowledgment", new TableIndex({
            name: "IDX_NEWS_ACK_USER",
            columnNames: ["userId"]
        }));

        await queryRunner.createIndex("news_acknowledgment", new TableIndex({
            name: "IDX_NEWS_ACK_COMPANY",
            columnNames: ["companyId"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("news_acknowledgment");
    }
}
