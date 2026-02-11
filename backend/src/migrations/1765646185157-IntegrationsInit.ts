import { MigrationInterface, QueryRunner } from "typeorm";

export class IntegrationsInit1765646185157 implements MigrationInterface {
    name = 'IntegrationsInit1765646185157'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enums
        await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."integration_providers_auth_flow_enum" AS ENUM('oauth2_cc_mtls', 'oauth2_cc', 'jwt_bearer', 'basic_cert', 'api_key'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
        await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."integration_connections_status_enum" AS ENUM('active', 'paused', 'error', 'setup_required'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
        await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."integration_runs_type_enum" AS ENUM('full', 'delta', 'test'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
        await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."integration_runs_status_enum" AS ENUM('running', 'success', 'partial_success', 'failed'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);

        // Tables
        await queryRunner.query(`DROP TABLE IF EXISTS "integration_providers" CASCADE`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "integration_providers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "name" character varying NOT NULL, "auth_flow" "public"."integration_providers_auth_flow_enum" NOT NULL DEFAULT 'oauth2_cc', "default_scopes" text, "api_version" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0c5b6c0694b624aa0d68fcb1096" UNIQUE ("key"), CONSTRAINT "PK_2c3b6dbe85f50abb5dcc96e6858" PRIMARY KEY ("id"))`);
        await queryRunner.query(`DROP TABLE IF EXISTS "integration_connections" CASCADE`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "integration_connections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "provider_key" character varying NOT NULL, "status" "public"."integration_connections_status_enum" NOT NULL DEFAULT 'setup_required', "base_url" character varying, "secrets_encrypted" jsonb, "options" jsonb, "watermarks" jsonb, "last_sync_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b1ec518bfa5fa7404045412de2e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`DROP TABLE IF EXISTS "integration_runs" CASCADE`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "integration_runs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "connection_id" uuid NOT NULL, "type" "public"."integration_runs_type_enum" NOT NULL DEFAULT 'delta', "started_at" TIMESTAMP NOT NULL DEFAULT now(), "finished_at" TIMESTAMP, "status" "public"."integration_runs_status_enum" NOT NULL DEFAULT 'running', "trigger" character varying, "stats" jsonb, CONSTRAINT "PK_b16026f9c5697bbf99fdb02ace8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`DROP TABLE IF EXISTS "integration_errors" CASCADE`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "integration_errors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "run_id" uuid NOT NULL, "entity_ref" character varying, "error_code" character varying, "message" text, "payload_dump" jsonb, "stack_trace" text, "retry_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_596d6884070c8197d8dbc91f3cb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`DROP TABLE IF EXISTS "identity_links" CASCADE`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "identity_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "internal_user_id" uuid NOT NULL, "company_id" character varying NOT NULL, "provider_key" character varying NOT NULL, "external_id" character varying NOT NULL, "active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "last_seen_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_752268a8618b739e2c007beae59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`DROP TABLE IF EXISTS "data_lake_snapshots" CASCADE`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "data_lake_snapshots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying NOT NULL, "snapshot_date" date NOT NULL, "data_source" character varying NOT NULL, "raw_data" jsonb NOT NULL, "salary_band_hash" character varying, "commute_distance_km" double precision, "tenure_days" integer, "days_since_last_promotion" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5bf45f1364d5756c8b07c33c185" PRIMARY KEY ("id"))`);

        // Indexes
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_2f9e9e53b95ff797d985c68b0b" ON "identity_links" ("internal_user_id", "provider_key") `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_e961882752d288c2dbdab5d967" ON "identity_links" ("provider_key", "external_id") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_77b2c516883fec06eebb305532" ON "data_lake_snapshots" ("user_id", "snapshot_date") `);

        // FKs
        // FKs
        await queryRunner.query(`DO $$ BEGIN ALTER TABLE "integration_connections" ADD CONSTRAINT "FK_ac036e81f8184b5c115d038a36f" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object THEN null; WHEN duplicate_table THEN null; END $$;`);
        await queryRunner.query(`DO $$ BEGIN ALTER TABLE "integration_runs" ADD CONSTRAINT "FK_1ad2e3de433c59725ba920834fb" FOREIGN KEY ("connection_id") REFERENCES "integration_connections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object THEN null; WHEN duplicate_table THEN null; END $$;`);
        await queryRunner.query(`DO $$ BEGIN ALTER TABLE "integration_errors" ADD CONSTRAINT "FK_39bb1ebb307aecbe1bfd2a53b1e" FOREIGN KEY ("run_id") REFERENCES "integration_runs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object THEN null; WHEN duplicate_table THEN null; END $$;`);
        await queryRunner.query(`DO $$ BEGIN ALTER TABLE "identity_links" ADD CONSTRAINT "FK_86db981d644f76538683725db66" FOREIGN KEY ("internal_user_id") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object THEN null; WHEN duplicate_table THEN null; END $$;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "identity_links" DROP CONSTRAINT IF EXISTS "FK_86db981d644f76538683725db66"`);
        await queryRunner.query(`ALTER TABLE "integration_errors" DROP CONSTRAINT IF EXISTS "FK_39bb1ebb307aecbe1bfd2a53b1e"`);
        await queryRunner.query(`ALTER TABLE "integration_runs" DROP CONSTRAINT IF EXISTS "FK_1ad2e3de433c59725ba920834fb"`);
        await queryRunner.query(`ALTER TABLE "integration_connections" DROP CONSTRAINT IF EXISTS "FK_ac036e81f8184b5c115d038a36f"`);

        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_77b2c516883fec06eebb305532"`);
        await queryRunner.query(`DROP TABLE "data_lake_snapshots"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e961882752d288c2dbdab5d967"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_2f9e9e53b95ff797d985c68b0b"`);
        await queryRunner.query(`DROP TABLE "identity_links"`);
        await queryRunner.query(`DROP TABLE "integration_errors"`);
        await queryRunner.query(`DROP TABLE "integration_runs"`);
        await queryRunner.query(`DROP TYPE "public"."integration_runs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."integration_runs_type_enum"`);
        await queryRunner.query(`DROP TABLE "integration_connections"`);
        await queryRunner.query(`DROP TYPE "public"."integration_connections_status_enum"`);
        await queryRunner.query(`DROP TABLE "integration_providers"`);
        await queryRunner.query(`DROP TYPE "public"."integration_providers_auth_flow_enum"`);
    }
}
