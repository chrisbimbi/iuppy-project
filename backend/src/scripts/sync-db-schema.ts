import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
    console.log('🔄 Synchronizing Database Schema...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const ds = app.get(DataSource);

    try {
        await ds.synchronize(false); // false = dont drop tables
        console.log('✅ Schema synchronized successfully.');
    } catch (err) {
        console.error('❌ Schema synchronization failed:', err);
    }

    await app.close();
}

bootstrap();
