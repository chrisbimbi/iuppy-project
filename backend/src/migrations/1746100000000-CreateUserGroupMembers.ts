import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateUserGroupMembers1746100000000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.createTable(new Table({
      name: 'user_group_members',
      columns: [
        { name: 'group_id', type: 'uuid', isNullable: false },
        { name: 'user_id',  type: 'uuid', isNullable: false },
      ],
      uniques: [
        { name: 'UQ_group_user', columnNames: ['group_id','user_id'] }
      ]
    }), true);

    await q.createForeignKey('user_group_members', new TableForeignKey({
      columnNames: ['group_id'],
      referencedTableName: 'user_group',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE'
    }));
    await q.createForeignKey('user_group_members', new TableForeignKey({
      columnNames: ['user_id'],
      referencedTableName: 'user_entity',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE'
    }));
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.dropTable('user_group_members');
  }
}