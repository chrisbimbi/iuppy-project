import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFormTemplate1766005000000 implements MigrationInterface {
    name = 'AddFormTemplate1766005000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "form" ADD COLUMN IF NOT EXISTS "template" character varying(50)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_form_template" ON "form" ("companyId", "template")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_form_template"`);
        await queryRunner.query(`ALTER TABLE "form" DROP COLUMN IF EXISTS "template"`);
    }
}
