// backend/src/migrations/1723321000001-AddGinIndexOnSurveySpaceIds.ts
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGinIndexOnSurveySpaceIds1723321000001 implements MigrationInterface {
  name = 'AddGinIndexOnSurveySpaceIds1723321000001'
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_survey_spaceIds_gin"
      ON "survey" USING GIN ("spaceIds")
    `)
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_survey_spaceIds_gin"`)
  }
}