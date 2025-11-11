import { MigrationInterface, QueryRunner } from 'typeorm';

export class FormsS2BadgeErrors1710000000001 implements MigrationInterface {
  name = 'FormsS2BadgeErrors1710000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.form_badge_state
        ADD COLUMN IF NOT EXISTS "errorCount" int NOT NULL DEFAULT 0;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // pode deixar sem dropar pra não quebrar ambiente
  }
}