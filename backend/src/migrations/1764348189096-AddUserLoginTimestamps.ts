import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserLoginTimestamps1764348189096 implements MigrationInterface {
  name = 'AddUserLoginTimestamps1764348189096';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "firstLoginAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "lastLoginAt" TIMESTAMP`,
    );
    // Optional: Safe defaults for arrays if needed
    await queryRunner.query(
      `ALTER TABLE "user_group" ALTER COLUMN "conditions" SET DEFAULT ARRAY[]::text[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group" ALTER COLUMN "adminIds" SET DEFAULT ARRAY[]::text[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ALTER COLUMN "groups" SET DEFAULT ARRAY[]::text[]`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP COLUMN "lastLoginAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP COLUMN "firstLoginAt"`,
    );
  }
}
