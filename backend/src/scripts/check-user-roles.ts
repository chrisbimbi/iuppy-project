
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function checkUsers() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const ds = app.get(DataSource);

    console.log('🔍 Checking existing user roles...');
    const results = await ds.query(`
        SELECT role, count(*) FROM user_entity GROUP BY role
    `);

    console.log('✅ Current Role Counts:', results);

    await app.close();
}

checkUsers();
