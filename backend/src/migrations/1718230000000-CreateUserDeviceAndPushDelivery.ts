import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateUserDeviceAndPushDelivery1718230000000 implements MigrationInterface {
  name = 'CreateUserDeviceAndPushDelivery1718230000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
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
      );
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_device_company_user
      ON user_device("companyId","userId");
    `)

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_user_device_company_token
      ON user_device("companyId", token);
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS push_delivery (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "companyId" uuid NOT NULL,
        "newsId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        platform text NULL,
        token text NULL,
        "messageId" text NULL,
        "deliveredAt" timestamptz NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_push_delivery_company_news
      ON push_delivery("companyId","newsId");
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_push_delivery_company_news_user
      ON push_delivery("companyId","newsId","userId");
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS push_delivery;`)
    await queryRunner.query(`DROP TABLE IF EXISTS user_device;`)
  }
}
