import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateModuleAccessGrants1764350581818 implements MigrationInterface {
    name = 'CreateModuleAccessGrants1764350581818'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "module_access_grants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" character varying NOT NULL, "userId" character varying NOT NULL, "moduleKey" character varying NOT NULL, "scopeType" text NOT NULL DEFAULT 'ALL_SPACES', "spaceIds" text array NOT NULL DEFAULT '{}', "canView" boolean NOT NULL DEFAULT false, "canEdit" boolean NOT NULL DEFAULT false, "canManage" boolean NOT NULL DEFAULT false, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6365a0249a19977f43dd4c02349" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_68a42ad6fbd6af7e191c363bf4" ON "module_access_grants" ("companyId", "userId", "moduleKey") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_68a42ad6fbd6af7e191c363bf4"`);
        await queryRunner.query(`DROP TABLE "module_access_grants"`);
    }

}
