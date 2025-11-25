import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSubmissionTimestamp1678886500000
  implements MigrationInterface
{
  name = 'FixSubmissionTimestamp1678886500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionamos "ADD COLUMN IF NOT EXISTS" para não quebrar se já existir
    await queryRunner.query(
      `ALTER TABLE "form_submission" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "form_submission" DROP COLUMN IF EXISTS "updatedAt"`,
    );
  }
}