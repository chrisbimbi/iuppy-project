
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function verifyDeleted() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const ds = app.get(DataSource);

    console.log('🔍 Verifying Soft-Deleted Users...');
    const results = await ds.query(`
        SELECT email, "isActive", "terminationDate", "employmentStatus" 
        FROM user_entity 
        WHERE "isActive" = false 
        LIMIT 5
    `);

    console.table(results);

    await app.close();
}

verifyDeleted();
