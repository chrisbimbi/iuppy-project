import { AppDataSource } from '../config/data-source';
import { JourneyEntity } from '../modules/journeys/entities/journey.entity';
import { JourneyStepEntity } from '../modules/journeys/entities/journey-step.entity';

// Add more journeys for better testing
enum StepContentType {
    ARTICLE = 'ARTICLE',
    VIDEO = 'VIDEO',
    QUIZ = 'QUIZ',
    POLL = 'POLL',
    FORM = 'FORM'
}

enum StepMediaType {
    NONE = 'NONE',
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    DOCUMENT = 'DOCUMENT'
}

async function seedAdditionalJourneys() {
    console.log('🌱 Initializing Data Source...');
    await AppDataSource.initialize();
    console.log('✅ Data Source Initialized!');

    const journeyRepo = AppDataSource.getRepository(JourneyEntity);
    const journeyStepRepo = AppDataSource.getRepository(JourneyStepEntity);

    // Get company ID from existing journey
    const existing = await journeyRepo.findOne({ where: { active: true } });
    if (!existing) {
        console.error('❌ No existing journey found!');
        process.exit(1);
    }

    const companyId = existing.companyId;
    const NINETY_DAYS_AGO = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const journeyTemplates = [
        {
            title: 'Treinamento de Segurança do Trabalho',
            description: 'Aprenda sobre segurança e prevenção de acidentes.',
            triggerType: 'MANUAL' as any,
            steps: [
                { title: 'Introdução à Segurança', type: StepContentType.VIDEO, delay: 0, order: 1 },
                { title: 'EPIs e Equipamentos', type: StepContentType.ARTICLE, delay: 1, order: 2 },
                { title: 'Procedimentos de Emergência', type: StepContentType.ARTICLE, delay: 2, order: 3 },
                { title: 'Quiz de Segurança', type: StepContentType.QUIZ, delay: 3, order: 4 },
            ]
        },
        {
            title: 'Desenvolvimento de Liderança',
            description: 'Desenvolva suas habilidades de liderança.',
            triggerType: 'MANUAL' as any,
            steps: [
                { title: 'Fundamentos da Liderança', type: StepContentType.VIDEO, delay: 0, order: 1 },
                { title: 'Comunicação Eficaz', type: StepContentType.ARTICLE, delay: 2, order: 2 },
                { title: 'Gestão de Conflitos', type: StepContentType.ARTICLE, delay: 4, order: 3 },
                { title: 'Avaliação Final', type: StepContentType.QUIZ, delay: 7, order: 4 },
            ]
        }
    ];

    for (const template of journeyTemplates) {
        // Check if journey already exists
        const exists = await journeyRepo.findOne({ where: { companyId, title: template.title } });
        if (!exists) {
            console.log(`Creating journey: ${template.title}`);
            const journey = journeyRepo.create({
                companyId,
                title: template.title,
                description: template.description,
                active: true,
                createdAt: NINETY_DAYS_AGO,
                triggerType: template.triggerType
            });
            await journeyRepo.save(journey);

            // Create Steps
            for (const s of template.steps) {
                await journeyStepRepo.save(journeyStepRepo.create({
                    journeyId: journey.id,
                    title: s.title,
                    contentType: s.type as any,
                    delayDays: s.delay,
                    orderIndex: s.order,
                    mediaType: StepMediaType.NONE
                }));
            }
            console.log(`✅ Created journey: ${template.title} with ${template.steps.length} steps`);
        } else {
            console.log(`Journey already exists: ${template.title}`);
        }
    }

    console.log('✅ Additional Journeys Created!');
    await AppDataSource.destroy();
}

seedAdditionalJourneys().catch((err) => {
    console.error('❌ Seed Failed:', err);
    process.exit(1);
});
