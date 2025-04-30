import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserGroups1746020007010 implements MigrationInterface {
    name = 'AddUserGroups1746020007010'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_group_type_enum" AS ENUM('OPEN', 'INTERNAL', 'CONDITIONAL', 'MANDATORY')`);
        await queryRunner.query(`CREATE TABLE "user_group" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" character varying NOT NULL, "name" character varying(100) NOT NULL, "identifier" character varying(100), "type" "public"."user_group_type_enum" NOT NULL, "conditions" text, "adminIds" text NOT NULL DEFAULT '', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3c29fba6fe013ec8724378ce7c9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fa71c3afdc436cc3753614ef00" ON "user_group" ("companyId", "identifier") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_fa71c3afdc436cc3753614ef00"`);
        await queryRunner.query(`DROP TABLE "user_group"`);
        await queryRunner.query(`DROP TYPE "public"."user_group_type_enum"`);
    }

}
