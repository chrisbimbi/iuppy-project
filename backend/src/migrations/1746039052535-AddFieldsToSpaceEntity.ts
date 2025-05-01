import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFieldsToSpaceEntity1746039052535 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('space_entity', [
            new TableColumn({
                name: 'distributionChannels',
                type: 'text',
                isArray: true,
                isNullable: false,
                default: `ARRAY['app']`
            }),
            new TableColumn({
                name: 'targetGroupIds',
                type: 'text',
                isArray: true,
                isNullable: true,
            }),
            new TableColumn({
                name: 'adminIds',
                type: 'text',
                isArray: true,
                isNullable: true,
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumns('space_entity', [
            'adminIds',
            'targetGroupIds',
            'distributionChannels',
        ]);
    }
}