
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    console.log('🔍 Debugging News Audience...');

    const targetEmail = 'ana.costa@demo.com.br';
    const user = (await dataSource.query(`SELECT id, "companyId" FROM user_entity WHERE email = '${targetEmail}'`))[0];

    if (!user) {
        console.error('❌ User not found');
        return;
    }

    console.log(`User: ${targetEmail} (${user.id})`);

    // 1. Get all News IDs for the company
    const news = await dataSource.query(`
        SELECT id, title 
        FROM news_entity 
        WHERE "companyId" = '${user.companyId}'
    `);

    console.log(`\n--- Checking Audience for ${news.length} News Items ---`);

    for (const n of news) {
        // Check if there is ANY audience rule for this news
        const audienceCount = await dataSource.query(`
            SELECT COUNT(*) as count 
            FROM news_audience 
            WHERE "newsId" = '${n.id}'
        `);

        // Check if THIS user is in the audience
        const userInAudience = await dataSource.query(`
            SELECT * 
            FROM news_audience 
            WHERE "newsId" = '${n.id}' AND "userId" = '${user.id}'
        `);

        const hasAudience = parseInt(audienceCount[0].count) > 0;
        const isUserIncluded = userInAudience.length > 0;

        console.log(`[${n.title}]`);
        console.log(`    - Total Audience Size: ${audienceCount[0].count}`);
        console.log(`    - Is Ana in Audience? ${isUserIncluded ? '✅ YES' : '❌ NO'}`);
    }

    await app.close();
}

bootstrap();
