import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateCompanyModules1710000000000 implements MigrationInterface {
  name = 'CreateCompanyModules1710000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS company_modules (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id text NOT NULL,
        key text NOT NULL,
        enabled boolean NOT NULL DEFAULT true,
        config jsonb NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (company_id, key)
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS company_modules`)
  }
}