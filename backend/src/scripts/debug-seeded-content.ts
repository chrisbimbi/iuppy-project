
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    console.log('🔍 Checking Seeded Content & Associations...');

    const targetEmail = 'ana.costa@demo.com.br';
    const user = (await dataSource.query(`SELECT id, "companyId" FROM user_entity WHERE email = '${targetEmail}'`))[0];

    if (!user) {
        console.error('❌ User not found');
        return;
    }

    console.log(`\n--- User Info ---`);
    console.log(`User: ${targetEmail} (${user.id})`);
    console.log(`Company ID: ${user.companyId}`);

    // 1. User Spaces
    const userSpaces = await dataSource.query(`
        SELECT s.id, s.name 
        FROM space s
        JOIN user_space_entity us ON us."spaceId" = s.id
        WHERE us."userId" = '${user.id}'
    `);
    const userSpaceIds = userSpaces.map(s => s.id);
    console.log(`\n--- User Spaces [${userSpaces.length}] ---`);
    userSpaces.forEach(s => console.log(` - ${s.name} (${s.id})`));

    // 2. Channels & News Summary
    const channels = await dataSource.query(`
        SELECT id, name, "space_ids"
        FROM channel
        WHERE "companyId" = '${user.companyId}'
    `);

    let visibleNewsCount = 0;
    console.log(`\n--- News Visibility Check ---`);
    for (const c of channels) {
        const linkedSpaceIds = c.space_ids || [];
        const isVisible = linkedSpaceIds.some(sid => userSpaceIds.includes(sid));

        const news = await dataSource.query(`
            SELECT id, title, "isPublished", "publishedAt"
            FROM news_entity
            WHERE "channelId" = '${c.id}'
        `);

        if (news.length > 0) {
            console.log(`Channel: ${c.name} [${isVisible ? 'VISIBLE' : 'HIDDEN'}] (News: ${news.length})`);
            if (isVisible) {
                news.forEach(n => {
                    console.log(`  - ${n.title} | Published: ${n.isPublished} | Date: ${n.publishedAt}`);
                    visibleNewsCount++;
                });
            }
        }
    }
    console.log(`Total Visible News found: ${visibleNewsCount}`);

    // 3. User Journey Details
    const instances = await dataSource.query(`
        SELECT ji.id, j.id as journey_id, j.title, ji.status, ji."startDate", ji."currentStep",
               (SELECT COUNT(*) FROM journey_steps s WHERE s."journeyId" = j.id) as step_count
        FROM user_journey_instances ji
        JOIN journeys j ON j.id = ji."journeyId"
        WHERE ji."userId" = '${user.id}'
    `);

    console.log(`\n--- User Journey Instances [${instances.length}] ---`);
    for (const i of instances) {
        console.log(`\nJourney: ${i.title} (${i.status})`);
        console.log(`  - Instance ID: ${i.id}`);
        console.log(`  - Started At: ${i.startDate}`);
        console.log(`  - Current Step Index: ${i.currentStep}`);
        console.log(`  - Total Steps: ${i.step_count}`);

        const steps = await dataSource.query(`
            SELECT id, title, "orderIndex", "delayDays", "releaseTime", "contentType"
            FROM journey_steps
            WHERE "journeyId" = '${i.journey_id}'
            ORDER BY "orderIndex" ASC
        `);

        console.log(`  - Steps:`);
        steps.forEach(s => {
            console.log(`    [${s.orderIndex}] ${s.title} (Delay: ${s.delayDays}, Time: ${s.releaseTime}, Type: ${s.contentType})`);
        });
    }

    // 4. Check available Journeys (Templates)
    const templates = await dataSource.query(`
        SELECT id, title, "companyId", "targetGroupId", "targetAudience"
        FROM journeys
        WHERE "companyId" = '${user.companyId}'
    `);
    console.log(`\n--- Available Journey Templates [${templates.length}] ---`);
    templates.forEach(t => console.log(` - ${t.title} (TargetGroup: ${t.targetGroupId}, Audience: ${JSON.stringify(t.targetAudience)})`));

    // 5. Simulate NewsService.findAll query
    console.log('\n--- Simulating NewsService.findAll ---');
    const newsRepo = dataSource.getRepository('NewsEntity'); // Using string to avoid import if possible, but earlier imports work
    // Ensure entities are imported in the script if not using string, assuming imports exist from previous steps

    // Let's rely on raw query since we can't easily reproduce NestJS DI/ORM full context here without imports
    // Replicating: qb.innerJoin('n.channel', 'c')

    // Test 1: Fetch all news with channel info
    const query = `
        SELECT n.id, n.title, c.name as channel_name, c.id as channel_id, c."space_ids"
        FROM news_entity n
        INNER JOIN channel c ON c.id = n."channelId"
        WHERE n."companyId" = '${user.companyId}'
    `;

    const results = await dataSource.query(query);
    console.log(`Query Results [${results.length}]:`);
    results.forEach(r => console.log(` - ${r.title} (Channel: ${r.channel_name}, Spaces: ${JSON.stringify(r.space_ids)})`));

    // Test 2: Apply space filter manual check
    // If the frontend does client-side filtering, it needs 'space_ids' in the response?
    // Let's check if the Channel Entity in News response has spaceIds populated.
    // In NewsService.findAll, it returns 'News[]'. News entity has 'channel'.
    // Does 'channel' have 'spaceIds' loaded?
    // The service does NOT doing .leftJoinAndSelect('n.channel', 'c') in the main findAll!
    // It only joins 'news_audience' and 'channel' (for ACL).
    // WAIT! src/news/news.service.ts:133 -> qb.innerJoin('n.channel', 'c') is only done IF allowedSpaceIds is present!
    // If regular user, NO join is done!
    // So the 'channel' property might be null or missing spaceIds!

    // Let's check if the API returns channel with spaceIds.

    await app.close();
}

bootstrap();
