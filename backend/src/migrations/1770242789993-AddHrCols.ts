import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHrCols1770242789993 implements MigrationInterface {
    name = 'AddHrCols1770242789993'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_entity" ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD COLUMN IF NOT EXISTS "registrationNumber" text`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD COLUMN IF NOT EXISTS "costCenter" text`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD COLUMN IF NOT EXISTS "terminationDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD COLUMN IF NOT EXISTS "payrollData" jsonb DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD COLUMN IF NOT EXISTS "vacationData" jsonb DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD COLUMN IF NOT EXISTS "contractType" text`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD COLUMN IF NOT EXISTS "workShift" text`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD COLUMN IF NOT EXISTS "managerEmail" text`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "groupIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "spaceIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user_entity" ALTER COLUMN "groups" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "space" ALTER COLUMN "distributionChannels" SET DEFAULT ARRAY['app'`);
        await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "adminIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "conditions" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "managerEmail"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "workShift"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "contractType"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "vacationData"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "payrollData"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "terminationDate"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "costCenter"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "registrationNumber"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "birthDate"`);
    }

}
