
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const ds = app.get(DataSource);
    const logger = new Logger('DebugForms');

    logger.log('--- Debugging Specific Form existence ---');
    const targetId = '0cade1ab-a6ed-4956-9604-379605f0a758';

    const formRaw = await ds.query('SELECT * FROM form WHERE id = $1', [targetId]);
    if (formRaw.length > 0) {
        const f = formRaw[0];
        console.table({
            id: f.id,
            companyId: f.companyId,
            title: typeof f.title === 'string' ? f.title : JSON.stringify(f.title),
            isNr1: f.isNr1
        });

        // Check if the requested companyId matches
        const requestedCid = '000c0911-58b3-4c80-84bc-fe015eec1961';
        if (f.companyId === requestedCid) {
            console.log('MATCH: The form belongs to the requested companyId.');
        } else {
            console.error(`MISMATCH: Form belongs to ${f.companyId}, but request was for ${requestedCid}`);
        }

    } else {
        console.error('CRITICAL: Form ID not found in database at all.');
    }

    await app.close();
}

bootstrap();
