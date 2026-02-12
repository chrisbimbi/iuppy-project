
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    console.log('🔍 Debugging Space Filter Issue...');

    const targetEmail = 'ana.costa@demo.com.br';
    const companyId = '2af4557f-9259-4eed-818d-1d0ffe0b8982';

    // 1. Get user's space assignments
    const user = (await dataSource.query(`SELECT id FROM user_entity WHERE email = '${targetEmail}'`))[0];

    const userSpaces = await dataSource.query(`
        SELECT s.id, s.name 
        FROM space s
        JOIN user_space_entity us ON us."spaceId" = s.id
        WHERE us."userId" = '${user.id}'
        ORDER BY s.name
    `);

    console.log(`\n--- Ana's Spaces ---`);
    userSpaces.forEach(s => console.log(`  ${s.name}: ${s.id}`));

    // 2. Get "Comunicados Oficiais" channel info
    const channel = await dataSource.query(`
        SELECT id, name, "space_ids"
        FROM channel
        WHERE name = 'Comunicados Oficiais' AND "companyId" = '${companyId}'
    `);

    console.log(`\n--- Comunicados Oficiais Channel ---`);
    if (channel.length > 0) {
        console.log(`  Channel ID: ${channel[0].id}`);
        console.log(`  Linked Space IDs: ${JSON.stringify(channel[0].space_ids)}`);

        // Check if any of Ana's spaces match the channel's spaces
        const channelSpaces = channel[0].space_ids || [];
        const userSpaceIds = userSpaces.map(s => s.id);

        console.log(`\n--- Space Match Check ---`);
        channelSpaces.forEach(csId => {
            const match = userSpaceIds.includes(csId);
            const spaceName = userSpaces.find(s => s.id === csId)?.name || 'UNKNOWN';
            console.log(`  ${csId} (${spaceName}): ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
        });
    }

    // 3. Check all spaces in the company
    const allSpaces = await dataSource.query(`
        SELECT id, name
        FROM space
        WHERE "companyId" = '${companyId}'
        ORDER BY name
    `);

    console.log(`\n--- All Spaces in Company ---`);
    allSpaces.forEach(s => console.log(`  ${s.name}: ${s.id}`));

    await app.close();
}

bootstrap();
