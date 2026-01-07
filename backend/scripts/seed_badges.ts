
import { AppDataSource } from '../src/config/data-source';
import { BadgeEntity, BadgeRuleType } from '../src/modules/gamification/entities/badge.entity';

async function seed() {
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5433'; // Force local Docker port

    await AppDataSource.initialize();
    console.log('Database connected.');

    const badgeRepo = AppDataSource.getRepository(BadgeEntity);

    const BADGES = [
        {
            slug: 'news-enthusiast-1',
            name: 'Leitor Ávido',
            description: 'Leu 5 conteúdos de notícias.',
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/2965/2965879.png',
            ruleType: BadgeRuleType.NEWS_READ_COUNT,
            ruleValue: 5,
        },
        {
            slug: 'survey-expert-1',
            name: 'Opinião de Ouro',
            description: 'Respondeu 3 pesquisas.',
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/1042/1042390.png',
            ruleType: BadgeRuleType.SURVEY_COUNT,
            ruleValue: 3,
        },
        {
            slug: 'journey-master-1',
            name: 'Desbravador',
            description: 'Completou 10 passos em jornadas.',
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/3112/3112946.png',
            ruleType: BadgeRuleType.JOURNEY_STEP_COUNT,
            ruleValue: 10,
        }
    ];

    for (const b of BADGES) {
        const existing = await badgeRepo.findOneBy({ slug: b.slug });
        if (existing) {
            console.log(`Badge ${b.slug} already exists. Updating...`);
            Object.assign(existing, b);
            await badgeRepo.save(existing);
        } else {
            console.log(`Creating Badge ${b.slug}...`);
            await badgeRepo.save(badgeRepo.create(b));
        }
    }

    console.log('Seeding complete.');
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
