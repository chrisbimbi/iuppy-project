import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddSpacesTable1746038900164 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'space_entity',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    { name: 'companyId', type: 'varchar' },
                    { name: 'name', type: 'varchar', length: '100' },
                    { name: 'slug', type: 'varchar', length: '100', isUnique: true },
                    { name: 'description', type: 'varchar', isNullable: true },
                    { name: 'imageUrl', type: 'varchar', isNullable: true },
                    { name: 'priority', type: 'int', default: '0' },
                    { name: 'active', type: 'boolean', default: 'true' },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('space_entity');
    }
}