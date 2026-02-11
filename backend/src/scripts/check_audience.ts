import { AppDataSource } from '../config/data-source';

async function checkAudience() {
    await AppDataSource.initialize();

    const companyId = '2af4557f-9259-4eed-818d-1d0ffe0b8982';
    const userId = '99999999-9999-9999-9999-999999999999';

    console.log('\n📊 VERIFICAÇÃO DE AUDIENCE');
    console.log('========================\n');

    // Check news
    const newsCount = await AppDataSource.query(
        `SELECT COUNT(*) as count FROM news_entity WHERE "companyId" = $1 AND "deletedAt" IS NULL`,
        [companyId]
    );
    console.log(`📰 Notícias no banco (company): ${newsCount[0].count}`);

    const newsAudienceCount = await AppDataSource.query(
        `SELECT COUNT(DISTINCT na."newsId") as count 
     FROM news_audience na 
     INNER JOIN news_entity n ON n.id = na."newsId"
     WHERE n."companyId" = $1 AND na."userId" = $2`,
        [companyId, userId]
    );
    console.log(`📰 Notícias com audience para Chris: ${newsAudienceCount[0].count}`);

    // Check surveys
    const surveysCount = await AppDataSource.query(
        `SELECT COUNT(*) as count FROM survey WHERE "companyId" = $1 AND visibility != 'journey_only'`,
        [companyId]
    );
    console.log(`\n📊 Enquetes no banco (company): ${surveysCount[0].count}`);

    // Check forms
    const formsCount = await AppDataSource.query(
        `SELECT COUNT(*) as count FROM form WHERE "companyId" = $1`,
        [companyId]
    );
    console.log(`\n📝 Formulários no banco (company): ${formsCount[0].count}`);

    // Check journeys
    const journeysCount = await AppDataSource.query(
        `SELECT COUNT(*) as count FROM journeys WHERE "companyId" = $1`,
        [companyId]
    );
    console.log(`\n🗺️ Jornadas no banco (company): ${journeysCount[0].count}`);

    const userJourneysCount = await AppDataSource.query(
        `SELECT COUNT(*) as count FROM user_journey_instances 
     WHERE "companyId" = $1 AND "userId" = $2`,
        [companyId, userId]
    );
    console.log(`🗺️ Jornadas atribuídas para Chris: ${userJourneysCount[0].count}`);

    // Check user's groups and spaces
    const userSpaces = await AppDataSource.query(
        `SELECT s.id, s.name FROM space s
     INNER JOIN user_space us ON us."spaceId" = s.id
     WHERE us."userId" = $1`,
        [userId]
    );
    console.log(`\n🏢 Spaces do Chris: ${userSpaces.length}`);
    userSpaces.forEach((s: any) => console.log(`   - ${s.name} (${s.id})`));

    const userGroups = await AppDataSource.query(
        `SELECT group_id FROM user_group_members WHERE user_id = $1::uuid`,
        [userId]
    );
    console.log(`\n👥 Grupos do Chris: ${userGroups.length}`);
    userGroups.forEach((g: any) => console.log(`   - ${g.group_id}`));

    // Sample news with settings
    const sampleNews = await AppDataSource.query(
        `SELECT id, title, settings FROM news_entity 
     WHERE "companyId" = $1 AND "deletedAt" IS NULL 
     LIMIT 1`,
        [companyId]
    );

    if (sampleNews.length > 0) {
        console.log(`\n📰 Exemplo de notícia:`);
        console.log(`   ID: ${sampleNews[0].id}`);
        console.log(`   Título: ${sampleNews[0].title}`);
        console.log(`   Settings:`, JSON.stringify(sampleNews[0].settings, null, 2));
    }

    await AppDataSource.destroy();
}

checkAudience().catch(console.error);
