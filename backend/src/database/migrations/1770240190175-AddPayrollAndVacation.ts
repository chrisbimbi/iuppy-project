import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPayrollAndVacation1770240190175 implements MigrationInterface {
    name = 'AddPayrollAndVacation1770240190175'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "birthDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "registrationNumber" text`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "costCenter" text`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "terminationDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "payrollData" jsonb DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "vacationData" jsonb DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "conditions" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "adminIds" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "space" ALTER COLUMN "distributionChannels" SET DEFAULT ARRAY['app']`);
        await queryRunner.query(`ALTER TABLE "user_entity" ALTER COLUMN "groups" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "spaceIds" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "groupIds" SET DEFAULT ARRAY[]::text[]`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "groupIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "survey" ALTER COLUMN "spaceIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user_entity" ALTER COLUMN "groups" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "space" ALTER COLUMN "distributionChannels" SET DEFAULT ARRAY['app'`);
        await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "adminIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user_group" ALTER COLUMN "conditions" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "vacationData"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "payrollData"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "terminationDate"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "costCenter"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "registrationNumber"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "birthDate"`);
    }

}
