
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function addColumns() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const ds = app.get(DataSource);

    console.log('🛠 Adding missing columns to user_entity...');
    try {
        await ds.query(`ALTER TABLE user_entity ADD COLUMN IF NOT EXISTS "jobTitle" text`);
        await ds.query(`ALTER TABLE user_entity ADD COLUMN IF NOT EXISTS department text`);
        console.log('✅ Columns added.');
    } catch (e) {
        console.error('❌ Failed to add columns:', e.message);
    }

    await app.close();
}

addColumns();
