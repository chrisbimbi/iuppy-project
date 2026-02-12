
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function checkEnum() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const ds = app.get(DataSource);

    console.log('🔍 Checking Role Enum in DB...');
    const results = await ds.query(`
        SELECT enumlabel 
        FROM pg_enum 
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
        WHERE pg_type.typname = 'user_entity_role_enum'
    `);

    console.log('✅ Role Enum Labels:', results.map((r: any) => r.enumlabel));

    await app.close();
}

checkEnum();
