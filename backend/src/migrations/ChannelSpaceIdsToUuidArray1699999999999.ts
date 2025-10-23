import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChannelSpaceIdsToUuidArray1699999999999 implements MigrationInterface {
  name = 'ChannelSpaceIdsToUuidArray1699999999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE channel
      ALTER COLUMN space_ids TYPE uuid[]
      USING (space_ids::uuid[])
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE channel
      ALTER COLUMN space_ids TYPE text[]
      USING (space_ids::text[])
    `);
  }
}