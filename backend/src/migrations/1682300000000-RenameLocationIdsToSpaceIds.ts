import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameLocationIdsToSpaceIds1682300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "channel"
      RENAME COLUMN "locationIds" TO "spaceIds"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "channel"
      RENAME COLUMN "spaceIds" TO "locationIds"
    `);
  }
}
