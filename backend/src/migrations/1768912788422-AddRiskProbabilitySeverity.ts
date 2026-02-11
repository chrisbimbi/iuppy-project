import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRiskProbabilitySeverity1768912788422 implements MigrationInterface {
    name = 'AddRiskProbabilitySeverity1768912788422'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nr1_risk_records" ADD COLUMN IF NOT EXISTS "probabilidade" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "nr1_risk_records" ADD COLUMN IF NOT EXISTS "severidade" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nr1_risk_records" DROP COLUMN "severidade"`);
        await queryRunner.query(`ALTER TABLE "nr1_risk_records" DROP COLUMN "probabilidade"`);
    }

}
