import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateUserDevice1710000000000 implements MigrationInterface {
  name = 'CreateUserDevice1710000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_device (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "companyId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        platform text NOT NULL,
        token text NOT NULL,
        "deviceId" text NULL,
        "userAgent" text NULL,
        locale text NULL,
        enabled boolean NOT NULL DEFAULT true,
        "disabledAt" timestamptz NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_device_company_user
      ON user_device("companyId","userId")
    `)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_user_device_company_token
      ON user_device("companyId", token)
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS ux_user_device_company_token`)
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_device_company_user`)
    await queryRunner.query(`DROP TABLE IF EXISTS user_device`)
  }
}