
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { NewsAudienceEntity } from '../v2/interactions/entities/news-audience.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const audienceRepo = dataSource.getRepository(NewsAudienceEntity);

    console.log('🔧 Populating News Audience for Seeded News...');

    const companyId = '2af4557f-9259-4eed-818d-1d0ffe0b8982';

    // Find all news with no audience
    const newsWithoutAudience = await dataSource.query(`
        SELECT n.id, n.title
        FROM news_entity n
        LEFT JOIN news_audience na ON na."newsId" = n.id
        WHERE n."companyId" = $1
        GROUP BY n.id
        HAVING COUNT(na."userId") = 0
    `, [companyId]);

    console.log(`Found ${newsWithoutAudience.length} news items without audience.`);

    if (newsWithoutAudience.length === 0) {
        console.log('✅ All news have audience. Nothing to do.');
        await app.close();
        return;
    }

    // Get all active users in the company
    const users = await dataSource.query(`
        SELECT id FROM user_entity WHERE "companyId" = $1 AND "isActive" = true
    `, [companyId]);

    console.log(`Found ${users.length} active users in company.`);

    // Populate audience for each news
    for (const news of newsWithoutAudience) {
        console.log(`\nPopulating audience for: ${news.title}`);

        const audienceEntries = users.map(u =>
            audienceRepo.create({
                companyId,
                newsId: news.id,
                userId: u.id,
                origemDaRegra: 'COMPANY' as any, // Default rule
            })
        );

        // Insert in batches to avoid overwhelming the DB
        const batchSize = 100;
        for (let i = 0; i < audienceEntries.length; i += batchSize) {
            const batch = audienceEntries.slice(i, i + batchSize);
            try {
                await audienceRepo.save(batch);
            } catch (e) {
                console.error(`Error saving batch: ${e.message}`);
            }
        }

        console.log(`✅ Added ${audienceEntries.length} audience entries for: ${news.title}`);
    }

    console.log('\n✅ All seeded news now have audience!');
    await app.close();
}

bootstrap();
