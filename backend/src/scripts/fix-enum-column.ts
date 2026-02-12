
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function fixEnum() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const ds = app.get(DataSource);

    console.log('🛠 Altering role column to text to bypass enum error...');
    try {
        await ds.query(`ALTER TABLE user_entity ALTER COLUMN role TYPE text`);
        console.log('✅ Altered to text.');
    } catch (e) {
        console.error('❌ Failed to alter to text:', e.message);
    }

    await app.close();
}

fixEnum();
