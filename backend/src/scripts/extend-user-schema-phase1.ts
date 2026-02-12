
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function extendUserSchema() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const ds = app.get(DataSource);

    console.log('🛠 Extending user_entity with dedicated columns for Phase 1...');
    try {
        await ds.query(`ALTER TABLE user_entity ADD COLUMN IF NOT EXISTS "admissionDate" timestamp`);
        await ds.query(`ALTER TABLE user_entity ADD COLUMN IF NOT EXISTS "salary" numeric(12,2)`);
        await ds.query(`ALTER TABLE user_entity ADD COLUMN IF NOT EXISTS "hiringType" text`);

        // Data Migration: Copy from existing fields
        console.log('🔄 Migrating existing data to new columns...');
        await ds.query(`UPDATE user_entity SET "admissionDate" = "hireDate" WHERE "admissionDate" IS NULL AND "hireDate" IS NOT NULL`);
        await ds.query(`UPDATE user_entity SET "hiringType" = "contractType" WHERE "hiringType" IS NULL AND "contractType" IS NOT NULL`);
        await ds.query(`UPDATE user_entity SET "salary" = (CAST("payrollData"->>'baseSalary' AS NUMERIC)) WHERE "salary" IS NULL AND "payrollData"->>'baseSalary' IS NOT NULL`);

        console.log('✅ Schema extended and data migrated.');
    } catch (e) {
        console.error('❌ Failed to extend schema:', e.message);
    }

    await app.close();
}

extendUserSchema();
