
import { AppDataSource } from '../config/data-source';

async function createNr1Tables() {
    try {
        console.log('🚀 Initializing Data Source...');
        await AppDataSource.initialize();
        console.log('✅ Data Source Initialized.');

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        console.log('🛠️ Creating Types...');
        const types = [
            `DO $$ BEGIN CREATE TYPE "public"."nr1_risk_level_enum" AS ENUM('b', 'm', 'a', 'ma'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
            `DO $$ BEGIN CREATE TYPE "public"."nr1_risk_status_enum" AS ENUM('ativo', 'inativo'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
            `DO $$ BEGIN CREATE TYPE "public"."nr1_action_priority_enum" AS ENUM('P0', 'P1', 'P2', 'P3'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
            `DO $$ BEGIN CREATE TYPE "public"."nr1_action_status_enum" AS ENUM('planejado', 'em_execucao', 'concluido', 'atrasado', 'cancelado'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
            `DO $$ BEGIN CREATE TYPE "public"."nr1_evidence_type_enum" AS ENUM('inventario', 'plano', 'treinamento', 'certificado', 'simulado', 'outros'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
            `DO $$ BEGIN CREATE TYPE "public"."nr1_training_type_enum" AS ENUM('inicial', 'periodico', 'eventual'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
            `DO $$ BEGIN CREATE TYPE "public"."nr1_training_modality_enum" AS ENUM('presencial', 'EAD', 'semipresencial'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
            `DO $$ BEGIN CREATE TYPE "public"."nr1_esocial_event_type_enum" AS ENUM('S2240', 'S2245'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
            `DO $$ BEGIN CREATE TYPE "public"."nr1_esocial_status_enum" AS ENUM('queued', 'sent', 'failed'); EXCEPTION WHEN duplicate_object THEN null; END $$;`
        ];

        for (const sql of types) {
            try { await queryRunner.query(sql); } catch (e) { console.warn('Type existing or error:', e.message); }
        }

        console.log('🛠️ Creating Tables...');

        // nr1_risk_criteria
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "nr1_risk_criteria" (
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

        // nr1_risk_records
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "nr1_risk_records" (
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
                "risk_type_id" uuid,
                "status" "public"."nr1_risk_status_enum" NOT NULL DEFAULT 'ativo', 
                "version" integer NOT NULL DEFAULT 1, 
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_nr1_risk_records_id" PRIMARY KEY ("id")
            )
        `);

        // nr1_risk_type 
        await queryRunner.query(`
             CREATE TABLE IF NOT EXISTS "nr1_risk_types" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "company_id" uuid NOT NULL, 
                "name" text NOT NULL,
                "description" text,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_nr1_risk_types_id" PRIMARY KEY ("id")
             )
        `);

        // FIX MISSING COLUMNS
        try { await queryRunner.query(`ALTER TABLE "nr1_risk_types" ADD COLUMN IF NOT EXISTS "color" text`); } catch (e) { }
        try { await queryRunner.query(`ALTER TABLE "nr1_risk_types" ADD COLUMN IF NOT EXISTS "icon" text`); } catch (e) { }
        try { await queryRunner.query(`ALTER TABLE "nr1_risk_types" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true`); } catch (e) { }

        console.log('✅ Tables Created & Columns Fixed.');
        await queryRunner.release();

    } catch (error) {
        console.error('❌ Error creating tables:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

createNr1Tables();
