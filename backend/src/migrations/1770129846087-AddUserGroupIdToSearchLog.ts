import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserGroupIdToSearchLog1770129846087 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "search_log" ADD "userGroupId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "search_log" DROP COLUMN "userGroupId"`);
    }

}
