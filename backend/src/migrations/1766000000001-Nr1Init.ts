import { MigrationInterface, QueryRunner } from "typeorm";

export class Nr1Init1766000000001 implements MigrationInterface {
    name = 'Nr1Init1766000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // --- ENUMS ---
        await queryRunner.query(`CREATE TYPE "public"."nr1_risk_level_enum" AS ENUM('b', 'm', 'a', 'ma')`);
        await queryRunner.query(`CREATE TYPE "public"."nr1_risk_status_enum" AS ENUM('ativo', 'inativo')`);
        await queryRunner.query(`CREATE TYPE "public"."nr1_action_priority_enum" AS ENUM('P0', 'P1', 'P2', 'P3')`);
        await queryRunner.query(`CREATE TYPE "public"."nr1_action_status_enum" AS ENUM('planejado', 'em_execucao', 'concluido', 'atrasado', 'cancelado')`);

        await queryRunner.query(`CREATE TYPE "public"."nr1_evidence_type_enum" AS ENUM('inventario', 'plano', 'treinamento', 'certificado', 'simulado', 'outros')`);

        await queryRunner.query(`CREATE TYPE "public"."nr1_training_type_enum" AS ENUM('inicial', 'periodico', 'eventual')`);
        await queryRunner.query(`CREATE TYPE "public"."nr1_training_modality_enum" AS ENUM('presencial', 'EAD', 'semipresencial')`);

        await queryRunner.query(`CREATE TYPE "public"."nr1_esocial_event_type_enum" AS ENUM('S2240', 'S2245')`);
        await queryRunner.query(`CREATE TYPE "public"."nr1_esocial_status_enum" AS ENUM('queued', 'sent', 'failed')`);

        // --- RISK MANAGEMENT ---

        // nr1_risk_criteria
        await queryRunner.query(`
            CREATE TABLE "nr1_risk_criteria" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "company_id" uuid NOT NULL, 
                "modelo" jsonb NOT NULL, 
                "versao" character varying(40) NOT NULL, 
                "assinado_icp" boolean NOT NULL DEFAULT false, 
                "assinatura_manifesto" text, 
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_nr1_risk_criteria_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_nr1_risk_criteria_unique" ON "nr1_risk_criteria" ("company_id", "versao")`);
        await queryRunner.query(`CREATE INDEX "IDX_nr1_risk_criteria_company_id" ON "nr1_risk_criteria" ("company_id")`);

        // nr1_risk_records
        await queryRunner.query(`
            CREATE TABLE "nr1_risk_records" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "company_id" uuid NOT NULL, 
                "space_id" uuid, 
                "channel_id" uuid, 
                "processo" character varying(160) NOT NULL, 
                "ambiente" character varying(160) NOT NULL, 
                "atividade" character varying(160) NOT NULL, 
                "perigo" text NOT NULL, 
                "fonte_circunstancia" text NOT NULL, 
                "possiveis_lesoes" text NOT NULL, 
                "grupos_expostos" jsonb NOT NULL, 
                "medidas_prevencao" jsonb NOT NULL, 
                "caracterizacao_exposicao" text NOT NULL, 
                "classificacao_risco" "public"."nr1_risk_level_enum" NOT NULL, 
                "criterios_id" uuid, 
                "status" "public"."nr1_risk_status_enum" NOT NULL DEFAULT 'ativo', 
                "version" integer NOT NULL DEFAULT 1, 
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_nr1_risk_records_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_nr1_risk_records_company_status" ON "nr1_risk_records" ("company_id", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_nr1_risk_records_context" ON "nr1_risk_records" ("company_id", "space_id", "channel_id")`);
        await queryRunner.query(`
            ALTER TABLE "nr1_risk_records" 
            ADD CONSTRAINT "FK_nr1_risk_records_criterios" 
            FOREIGN KEY ("criterios_id") REFERENCES "nr1_risk_criteria"("id") ON DELETE SET NULL ON UPDATE CASCADE
        `);

        // nr1_action_plans
        await queryRunner.query(`
            CREATE TABLE "nr1_action_plans" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "risk_id" uuid NOT NULL, 
                "medida_prevencao" text NOT NULL, 
                "prioridade" "public"."nr1_action_priority_enum" NOT NULL DEFAULT 'P2', 
                "responsavel_id" uuid, 
                "inicio_previsto" date, 
                "fim_previsto" date, 
                "forma_acompanhamento" text, 
                "kpi" jsonb, 
                "status" "public"."nr1_action_status_enum" NOT NULL DEFAULT 'planejado', 
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_nr1_action_plans_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_nr1_action_plans_risk_id" ON "nr1_action_plans" ("risk_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_nr1_action_plans_status_priority" ON "nr1_action_plans" ("status", "prioridade")`);
        await queryRunner.query(`CREATE INDEX "IDX_nr1_action_plans_responsavel_status" ON "nr1_action_plans" ("responsavel_id", "status")`);
        await queryRunner.query(`
            ALTER TABLE "nr1_action_plans" 
            ADD CONSTRAINT "FK_nr1_action_plans_risk" 
            FOREIGN KEY ("risk_id") REFERENCES "nr1_risk_records"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // nr1_versions
        await queryRunner.query(`
            CREATE TABLE "nr1_versions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "company_id" uuid NOT NULL, 
                "space_id" uuid, 
                "snapshot_url" text NOT NULL, 
                "assinado_icp" boolean NOT NULL DEFAULT false, 
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_nr1_versions_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_nr1_versions_company_space" ON "nr1_versions" ("company_id", "space_id")`);

        // --- EMERGENCY ---

        // nr1_emergency_procedures
        await queryRunner.query(`
             CREATE TABLE "nr1_emergency_procedures" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "company_id" uuid NOT NULL, 
                "titulo" text NOT NULL, 
                "conteudo" text NOT NULL, 
                "versao" character varying(40) NOT NULL, 
                "assinado_icp" boolean NOT NULL DEFAULT false, 
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_nr1_emergency_procedures_id" PRIMARY KEY ("id")
             )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_nr1_procedures_unique" ON "nr1_emergency_procedures" ("company_id", "titulo", "versao")`);

        // nr1_emergency_drills
        await queryRunner.query(`
            CREATE TABLE "nr1_emergency_drills" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "company_id" uuid NOT NULL, 
                "procedure_id" uuid NOT NULL, 
                "data_agendada" TIMESTAMP WITH TIME ZONE NOT NULL, 
                "local" text NOT NULL, 
                "checklist" jsonb, 
                "relatorio" text, 
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_nr1_emergency_drills_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_nr1_emergency_drills_date" ON "nr1_emergency_drills" ("data_agendada")`);
        await queryRunner.query(`ALTER TABLE "nr1_emergency_drills" ADD CONSTRAINT "FK_nr1_drills_procedure" FOREIGN KEY ("procedure_id") REFERENCES "nr1_emergency_procedures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // nr1_drill_attendance
        await queryRunner.query(`
            CREATE TABLE "nr1_drill_attendance" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "drill_id" uuid NOT NULL, 
                "user_id" uuid NOT NULL, 
                "hora_checkin" TIMESTAMP WITH TIME ZONE NOT NULL, 
                "metodo" character varying NOT NULL DEFAULT 'QR', 
                "evidencias" jsonb, 
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_nr1_drill_attendance_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_nr1_drill_attendance_unique" ON "nr1_drill_attendance" ("drill_id", "user_id")`);
        await queryRunner.query(`ALTER TABLE "nr1_drill_attendance" ADD CONSTRAINT "FK_nr1_attendance_drill" FOREIGN KEY ("drill_id") REFERENCES "nr1_emergency_drills"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // --- TRAININGS ---

        // nr1_trainings
        await queryRunner.query(`
            CREATE TABLE "nr1_trainings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "company_id" uuid NOT NULL,
                "titulo" text NOT NULL,
                "tipo" "public"."nr1_training_type_enum" NOT NULL,
                "modalidade" "public"."nr1_training_modality_enum" NOT NULL,
                "carga_horaria" numeric(5,1) NOT NULL,
                "projeto_pedagogico_url" text,
                "conteudos" jsonb NOT NULL,
                "requisitos_anexo_ii" jsonb,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_nr1_trainings_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_nr1_trainings_company" ON "nr1_trainings" ("company_id")`);

        // nr1_training_sessions
        await queryRunner.query(`
            CREATE TABLE "nr1_training_sessions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "training_id" uuid NOT NULL,
                "segmento_audiencia" jsonb NOT NULL,
                "data_inicio" TIMESTAMP WITH TIME ZONE,
                "data_fim" TIMESTAMP WITH TIME ZONE,
                "obrigatorio" boolean NOT NULL DEFAULT true,
                "periodicidade_months" integer,
                "recorrente" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_nr1_training_sessions_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`ALTER TABLE "nr1_training_sessions" ADD CONSTRAINT "FK_nr1_sessions_training" FOREIGN KEY ("training_id") REFERENCES "nr1_trainings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // nr1_training_attempts
        await queryRunner.query(`
            CREATE TABLE "nr1_training_attempts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "session_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "tempo_total_seg" integer NOT NULL DEFAULT 0,
                "progresso" numeric(5,2) NOT NULL DEFAULT 0,
                "nota_final" numeric(5,2),
                "quiz_log" jsonb,
                "ultimo_evento_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_nr1_training_attempts_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_nr1_attempts_unique" ON "nr1_training_attempts" ("session_id", "user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_nr1_attempts_user" ON "nr1_training_attempts" ("user_id")`);
        await queryRunner.query(`ALTER TABLE "nr1_training_attempts" ADD CONSTRAINT "FK_nr1_attempts_session" FOREIGN KEY ("session_id") REFERENCES "nr1_training_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // nr1_training_certificates
        await queryRunner.query(`
            CREATE TABLE "nr1_training_certificates" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "session_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "numero" character varying(40) NOT NULL,
                "arquivo_url" text NOT NULL,
                "assinado_icp" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_nr1_training_certificates_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_nr1_certificates_numero" ON "nr1_training_certificates" ("numero")`);
        await queryRunner.query(`ALTER TABLE "nr1_training_certificates" ADD CONSTRAINT "FK_nr1_certificates_session" FOREIGN KEY ("session_id") REFERENCES "nr1_training_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // --- EVIDENCE ---

        // nr1_evidence_files
        await queryRunner.query(`
            CREATE TABLE "nr1_evidence_files" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "company_id" uuid NOT NULL,
                "tipo" "public"."nr1_evidence_type_enum" NOT NULL,
                "file_url" text NOT NULL,
                "sha256" text NOT NULL,
                "assinado_icp" boolean NOT NULL DEFAULT false,
                "manifesto" text,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_nr1_evidence_files_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_nr1_evidence_files_sha256" ON "nr1_evidence_files" ("sha256")`);
        await queryRunner.query(`CREATE INDEX "IDX_nr1_evidence_files_company" ON "nr1_evidence_files" ("company_id")`);

        // --- ESOCIAL ---

        // nr1_esocial_queue
        await queryRunner.query(`
            CREATE TABLE "nr1_esocial_queue" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "company_id" uuid NOT NULL,
                "event_type" "public"."nr1_esocial_event_type_enum" NOT NULL,
                "payload" jsonb NOT NULL,
                "status" "public"."nr1_esocial_status_enum" NOT NULL DEFAULT 'queued',
                "retries" integer NOT NULL DEFAULT 0,
                "last_error" text,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_nr1_esocial_queue_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_nr1_esocial_queue_company_status" ON "nr1_esocial_queue" ("company_id", "status")`);

        // nr1_esocial_results
        await queryRunner.query(`
            CREATE TABLE "nr1_esocial_results" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "queue_id" uuid NOT NULL,
                "receipt" text,
                "status_code" integer NOT NULL,
                "status_msg" text NOT NULL,
                "raw_response" jsonb,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_nr1_esocial_results_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`ALTER TABLE "nr1_esocial_results" ADD CONSTRAINT "FK_nr1_results_queue" FOREIGN KEY ("queue_id") REFERENCES "nr1_esocial_queue"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys first to avoid dependency issues
        await queryRunner.query(`ALTER TABLE "nr1_esocial_results" DROP CONSTRAINT "FK_nr1_results_queue"`);
        await queryRunner.query(`ALTER TABLE "nr1_training_certificates" DROP CONSTRAINT "FK_nr1_certificates_session"`);
        await queryRunner.query(`ALTER TABLE "nr1_training_attempts" DROP CONSTRAINT "FK_nr1_attempts_session"`);
        await queryRunner.query(`ALTER TABLE "nr1_training_sessions" DROP CONSTRAINT "FK_nr1_sessions_training"`);
        await queryRunner.query(`ALTER TABLE "nr1_drill_attendance" DROP CONSTRAINT "FK_nr1_attendance_drill"`);
        await queryRunner.query(`ALTER TABLE "nr1_emergency_drills" DROP CONSTRAINT "FK_nr1_drills_procedure"`);
        await queryRunner.query(`ALTER TABLE "nr1_action_plans" DROP CONSTRAINT "FK_nr1_action_plans_risk"`);
        await queryRunner.query(`ALTER TABLE "nr1_risk_records" DROP CONSTRAINT "FK_nr1_risk_records_criterios"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "nr1_esocial_results"`);
        await queryRunner.query(`DROP TABLE "nr1_esocial_queue"`);
        await queryRunner.query(`DROP TABLE "nr1_evidence_files"`);
        await queryRunner.query(`DROP TABLE "nr1_training_certificates"`);
        await queryRunner.query(`DROP TABLE "nr1_training_attempts"`);
        await queryRunner.query(`DROP TABLE "nr1_training_sessions"`);
        await queryRunner.query(`DROP TABLE "nr1_trainings"`);
        await queryRunner.query(`DROP TABLE "nr1_drill_attendance"`);
        await queryRunner.query(`DROP TABLE "nr1_emergency_drills"`);
        await queryRunner.query(`DROP TABLE "nr1_emergency_procedures"`);
        await queryRunner.query(`DROP TABLE "nr1_versions"`);
        await queryRunner.query(`DROP TABLE "nr1_action_plans"`);
        await queryRunner.query(`DROP TABLE "nr1_risk_records"`);
        await queryRunner.query(`DROP TABLE "nr1_risk_criteria"`);

        // Drop enums
        await queryRunner.query(`DROP TYPE "public"."nr1_esocial_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_esocial_event_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_training_modality_enum"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_training_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_evidence_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_action_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_action_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_risk_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."nr1_risk_level_enum"`);
    }
}
