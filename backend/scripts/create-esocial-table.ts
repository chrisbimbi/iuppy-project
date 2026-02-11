// Script to create company_esocial_config table
import { AppDataSource } from '../src/config/data-source';

async function createTable() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const sql = `
            CREATE TABLE IF NOT EXISTS company_esocial_config (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "companyId" uuid UNIQUE NOT NULL,
                enabled boolean DEFAULT false,
                environment varchar DEFAULT 'homologacao',
                "certificateData" text,
                "certificatePassword" text,
                "certificateExpiry" timestamptz,
                "medicoNome" varchar,
                "medicoCpf" varchar,
                "medicoCrm" varchar,
                "medicoUf" char(2),
                "engenheiroNome" varchar,
                "engenheiroCpf" varchar,
                "engenheiroCrea" varchar,
                "engenheiroUf" char(2),
                configured boolean DEFAULT false,
                "connectionTested" boolean DEFAULT false,
                "lastTestedAt" timestamptz,
                "createdAt" timestamptz DEFAULT now(),
                "updatedAt" timestamptz DEFAULT now()
            );
        `;

        await AppDataSource.query(sql);
        console.log('✅ Table company_esocial_config created successfully!');

        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTable();
