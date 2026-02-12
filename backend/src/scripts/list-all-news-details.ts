
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    console.log('🔍 Listing ALL News Details...');

    // Get all news with their channel and company
    const allNews = await dataSource.query(`
        SELECT n.id, n.title, n."channelId", n."companyId", n."isPublished"
        FROM news_entity n
    `);

    console.log(`\nFound ${allNews.length} news items total.`);

    // Get all channels to map IDs to Names and Spaces
    const channels = await dataSource.query(`SELECT id, name, "space_ids" FROM channel`);
    const channelMap = {};
    channels.forEach(c => {
        channelMap[c.id] = { name: c.name, spaces: c.space_ids || [] };
    });

    // List them
    for (const n of allNews) {
        const ch = channelMap[n.channelId];
        const chName = ch ? ch.name : 'UNKNOWN_CHANNEL';
        const chSpaces = ch ? JSON.stringify(ch.spaces) : '[]';

        console.log(`[News] "${n.title}"`);
        console.log(`    - Channel: ${chName} (${n.channelId})`);
        console.log(`    - Spaces: ${chSpaces}`);
        console.log(`    - Company: ${n.companyId}`);
        console.log(`    - Published: ${n.isPublished}`);
        console.log('------------------------------------------------');
    }

    await app.close();
}

bootstrap();
