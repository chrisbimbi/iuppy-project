
import { AppDataSource } from '../config/data-source';
import { UserEntity } from '../users/user.entity';
import { NewsEntity } from '../news/news.entity';
import { NewsReactionEntity } from '../v2/interactions/entities/news-reaction.entity';
import { NewsCommentEntity } from '../v2/interactions/entities/news-comment.entity';
import { SurveyEntity } from '../modules/surveys/entities/survey.entity';
import { SurveyResponseEntity } from '../modules/surveys/entities/survey-response.entity';
import { SurveyQuestionEntity } from '../modules/surveys/entities/survey-question.entity';
import { FormEntity } from '../modules/forms/entities/form.entity';
import { FormFieldEntity } from '../modules/forms/entities/form-field.entity';
import { FormSubmissionEntity } from '../modules/forms/entities/form-submission.entity';
import { FormAnswerEntity } from '../modules/forms/entities/form-answer.entity';
import { JourneyEntity } from '../modules/journeys/entities/journey.entity';
import { JourneyStepEntity } from '../modules/journeys/entities/journey-step.entity';
import { UserJourneyInstanceEntity } from '../modules/journeys/entities/user-journey-instance.entity';
import { StepCompletionEntity } from '../modules/journeys/entities/step-completion.entity';
import { Nr1RiskRecord, RiskLevel, RiskStatus } from '../modules/nr1/entities/nr1-risk-record.entity';
import { InteractionEventEntity } from '../v2/interactions/entities/interaction-event.entity';
import { FormMetricsDailyEntity } from '../modules/forms/entities/form-metrics-daily.entity';
import { NewsMetricsDailyEntity } from '../v2/interactions/entities/news-metrics-daily.entity';
import { UserXPHistoryEntity, GamificationActionType } from '../modules/gamification/entities/user-xp-history.entity';
import { UserMetricsDailyEntity } from '../v2/interactions/entities/user-metrics-daily.entity';
import { Like, In } from 'typeorm';
import * as argon2 from 'argon2';
import { SpaceEntity } from '../spaces/space.entity';
import { Channel } from '../channels/channel.entity';
import { GroupEntity } from '../groups/group.entity';
import { UserSpaceEntity } from '../spaces/user-space.entity';
import { NewsShareEntity } from '../v2/interactions/entities/news-share.entity';
import { UserGroupType } from '@shared/types'; // Might need full path if mapped, checking local enum first

// --- Local Enum Definitions ---
enum Role {
    User = 'user',
    CompanyAdmin = 'company_admin',
    HRAdmin = 'hr_admin',
    Manager = 'manager'
}

enum StepMediaType {
    NONE = 'NONE',
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    DOCUMENT = 'DOCUMENT'
}

enum StepContentType {
    ARTICLE = 'ARTICLE',
    VIDEO = 'VIDEO',
    QUIZ = 'QUIZ',
    POLL = 'POLL',
    FORM = 'FORM'
}

enum JourneyInstanceStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    DROPPED = 'DROPPED'
}



type FormFieldType = 'short_text' | 'long_text' | 'number' | 'date' | 'multi_choice' | 'single_choice' | 'stars' | 'scale';

// Helpers
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T>(arr: T[]): T | undefined => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const COMMENTS = [
    "Ótima iniciativa!", "Parabéns!", "Muito bom!", "Adorei.",
    "Interessante.", "Vou verificar.", "Top!", "10/10"
];

async function seed() {
    console.log('🌱 Initializing Data Source...');
    await AppDataSource.initialize();
    console.log('✅ Data Source Initialized!');

    // Repositories
    const userRepo = AppDataSource.getRepository(UserEntity);
    const newsRepo = AppDataSource.getRepository(NewsEntity);
    const reactionRepo = AppDataSource.getRepository(NewsReactionEntity);
    const commentRepo = AppDataSource.getRepository(NewsCommentEntity);
    const surveyRepo = AppDataSource.getRepository(SurveyEntity);
    const surveyResponseRepo = AppDataSource.getRepository(SurveyResponseEntity);
    const formRepo = AppDataSource.getRepository(FormEntity);
    const formFieldRepo = AppDataSource.getRepository(FormFieldEntity);
    const submissionRepo = AppDataSource.getRepository(FormSubmissionEntity);
    const answerRepo = AppDataSource.getRepository(FormAnswerEntity);
    const journeyRepo = AppDataSource.getRepository(JourneyEntity);
    const journeyStepRepo = AppDataSource.getRepository(JourneyStepEntity);
    const userJourneyRepo = AppDataSource.getRepository(UserJourneyInstanceEntity);
    const stepCompletionRepo = AppDataSource.getRepository(StepCompletionEntity);
    const riskRepo = AppDataSource.getRepository(Nr1RiskRecord);
    const interactionRepo = AppDataSource.getRepository(InteractionEventEntity);
    const formMetricsRepo = AppDataSource.getRepository(FormMetricsDailyEntity);
    const xpRepo = AppDataSource.getRepository(UserXPHistoryEntity);
    const spaceRepo = AppDataSource.getRepository(SpaceEntity);
    const channelRepo = AppDataSource.getRepository(Channel);
    const groupRepo = AppDataSource.getRepository(GroupEntity);
    const userSpaceRepo = AppDataSource.getRepository(UserSpaceEntity);
    const shareRepo = AppDataSource.getRepository(NewsShareEntity);
    const newsMetricsRepo = AppDataSource.getRepository(NewsMetricsDailyEntity);

    // 0. Clean up existing structural data (optional but good for repeatability)
    // await spaceRepo.delete({ companyId }); // Careful with cascades

    console.log('🔍 Fetching mock users...');
    let allUsers = await userRepo.find({ where: { email: Like('%@empresa.com.br') } });

    if (allUsers.length === 0) {
        console.error('❌ No mock users found! Run sync first.');
        process.exit(1);
    }

    // Hash for '123456'
    const passwordHash = await argon2.hash('123456');

    // 1.1 Create 5 Specific Demo Users
    // Using widely accepted Roles to avoid Enum errors (Manager/Director might not exist in DB Enum)
    const demoUsersData = [
        { email: 'julia.silva@demo.com.br', name: 'Julia Silva', role: Role.CompanyAdmin, cpf: '123.456.789-00' },
        { email: 'roberto.almeida@demo.com.br', name: 'Roberto Almeida', role: Role.Manager, cpf: '234.567.890-11' },
        { email: 'ana.costa@demo.com.br', name: 'Ana Costa', role: Role.Manager, cpf: '345.678.901-22' },
        { email: 'lucas.pereira@demo.com.br', name: 'Lucas Pereira', role: Role.User, cpf: '456.789.012-33' },
        { email: 'fernanda.lima@demo.com.br', name: 'Fernanda Lima', role: Role.User, cpf: '567.890.123-44' }
    ];

    console.log('🔑 Creating/Updating Demo Users...');
    const demoUsersEntities: any[] = [];

    for (const u of demoUsersData) {
        // Use 'any' cast to avoid strict Role enum checks if imports differ
        let user: any = await userRepo.findOne({ where: { email: u.email } });
        if (!user) {
            user = userRepo.create({
                email: u.email,
                name: u.name,
                companyId: allUsers[0].companyId,
                role: u.role as any,
                password: passwordHash,
                cpf: (u as any).cpf,
                isActive: true,
                createdAt: new Date(),
                xp: 0
            } as any);
        } else {
            user.password = passwordHash;
            user.role = u.role as any;
            user.cpf = (u as any).cpf;
        }
        await userRepo.save(user);
        demoUsersEntities.push(user);
    }

    // Add demo users to the pool
    allUsers = [...allUsers, ...demoUsersEntities];

    // Shuffle and pick 70% but ensure demo users are included
    const shuffled = allUsers.sort(() => 0.5 - Math.random());
    const targetUsers = shuffled.slice(0, Math.floor(allUsers.length * 0.7));

    // Ensure demo users are in targetUsers
    for (const dUser of demoUsersEntities) {
        if (!targetUsers.find(u => u.id === dUser.id)) {
            targetUsers.push(dUser);
        }
    }

    console.log('🎯 Targeted ' + targetUsers.length + ' users (70% + demo) for engagement.');

    const companyId = targetUsers[0].companyId;
    const authorId = targetUsers[0].id;

    // Time window: Last 90 days
    const NOW = new Date();
    const NINETY_DAYS_AGO = new Date(NOW.getTime() - 90 * 24 * 60 * 60 * 1000);

    // =========================================================================
    // 1.5 SPACES, GROUPS, CHANNELS (STRUCTURE)
    // =========================================================================
    console.log('🏗️  Building Structure (Spaces, Groups, Channels)...');

    // GROUPS
    let groups = await groupRepo.find({ where: { companyId } });
    let groupAll = groups.find(g => g.name === 'Todos');
    if (!groupAll) {
        groupAll = await groupRepo.save(groupRepo.create({
            companyId, name: 'Todos', type: UserGroupType.INTERNAL, isChatEnabled: true
        }));
    }
    let groupManagers = groups.find(g => g.name === 'Gestão');
    if (!groupManagers) {
        groupManagers = await groupRepo.save(groupRepo.create({
            companyId, name: 'Gestão', type: UserGroupType.INTERNAL
        }));
    }

    // SPACES
    const spaceData = [
        { name: 'Institucional', slug: 'institucional', priority: 1, active: true },
        { name: 'Social', slug: 'social', priority: 2, active: true },
        { name: 'Bem-Estar', slug: 'bem-estar', priority: 3, active: true },
    ];
    const spaces: SpaceEntity[] = [];
    for (const sd of spaceData) {
        let sp = await spaceRepo.findOne({ where: { companyId, slug: sd.slug } });
        if (!sp) {
            sp = await spaceRepo.save(spaceRepo.create({ ...sd, companyId }));
        }
        spaces.push(sp);
    }

    // CHANNELS (Linked to Spaces)
    const channelData = [
        { name: 'Comunicados Oficiais', spaceIdx: 0 },
        { name: 'Novidades', spaceIdx: 0 },
        { name: 'Mural Social', spaceIdx: 1 },
        { name: 'Eventos', spaceIdx: 1 },
        { name: 'Vida Saudável', spaceIdx: 2 },
    ];
    const channels: Channel[] = [];
    for (const cd of channelData) {
        let ch = await channelRepo.findOne({ where: { companyId, name: cd.name } });
        if (!ch) {
            ch = await channelRepo.save(channelRepo.create({
                companyId,
                name: cd.name,
                spaceIds: [spaces[cd.spaceIdx].id],
                isPublished: true,
                position: 0
            }));
        }
        channels.push(ch);
    }

    // ASSIGN USERS TO STRUCTURE
    console.log('👥 Assigning Users to Structure...');
    for (const user of targetUsers) {
        // Add to 'Todos' group (simplified, assume relation exists or just skip if ManyToMany is complex to seed directly without relation loading)
        // For UserSpace, we use the explicit entity
        for (const sp of spaces) {
            const exists = await userSpaceRepo.findOne({ where: { userId: user.id, spaceId: sp.id } });
            if (!exists) {
                await userSpaceRepo.save(userSpaceRepo.create({
                    userId: user.id, spaceId: sp.id, companyId, role: 'member'
                }));
            }
        }
    }

    // =========================================================================
    // 2. NEWS (NOTÍCIAS)
    // =========================================================================
    console.log('📝 Generating News...');
    let newsList = await newsRepo.find({ where: { companyId } });
    if (newsList.length < 5) {
        const newNewsItems = [
            { title: "Novo Benefício: Gympass para todos!", content: "É com alegria que anunciamos nossa parceria com o Gympass...", authorId },
            { title: "Resultado do Trimestre superou expectativas", content: "Batemos todas as metas! Veja os números...", authorId },
            { title: "Bem-vindos ao novo escritório de SP", content: "Confira as fotos da nossa nova sede na Faria Lima.", authorId },
            { title: "Campanha de Doação de Sangue", content: "Participe da nossa campanha anual e salve vidas.", authorId },
            { title: "Dicas de Ergonomia para Home Office", content: "Como ajustar sua cadeira e monitor para evitar dores.", authorId },
            { title: "Festa de Final de Ano: Save the Date!", content: "Prepare-se para a maior festa da nossa história.", authorId },
            { title: "Novos Cursos na Plataforma de Ensino", content: "Aproveite para se capacitar com novos cursos de Excel e Inglês.", authorId },
        ];

        for (let i = 0; i < newNewsItems.length; i++) {
            const item = newNewsItems[i];
            // Scatter dates over 90 days
            const date = randomDate(NINETY_DAYS_AGO, NOW);

            const news = newsRepo.create({
                companyId,
                authorId: item.authorId,
                title: item.title,
                content: item.content,
                isPublished: true,
                mustAcknowledge: false,
                isNr1: false,
                channelId: (randomItem(channels) || channels[0])?.id, // Assign to random channel
                createdAt: date,
                publishedAt: date
            });
            await newsRepo.save(news);
        }
        newsList = await newsRepo.find({ where: { companyId } });
    }

    // =========================================================================
    // 3. JOURNEYS & STEPS
    // =========================================================================
    console.log('🚀 Generating Journeys...');
    let journeys = await journeyRepo.find({ where: { companyId }, relations: ['steps'] });
    let journey = journeys.find(j => j.title === 'Onboarding Digital');

    if (!journey) {
        journey = journeyRepo.create({
            companyId,
            title: 'Onboarding Digital',
            description: 'Sua jornada de boas-vindas à empresa.',
            active: true,
            createdAt: NINETY_DAYS_AGO,
            triggerType: 'ONBOARDING' as any
        });
        await journeyRepo.save(journey);

        // Create Steps
        const stepsData = [
            { title: 'Bem-vindo!', type: StepContentType.VIDEO, delay: 0, order: 1 },
            { title: 'Nossa Cultura', type: StepContentType.ARTICLE, delay: 1, order: 2 },
            { title: 'Configurando seus Acessos', type: StepContentType.ARTICLE, delay: 2, order: 3 },
            { title: 'Tour pelo Escritório', type: StepContentType.VIDEO, delay: 3, order: 4 },
            { title: 'Quiz de Cultura', type: StepContentType.QUIZ, delay: 5, order: 5 },
        ];

        for (const s of stepsData) {
            await journeyStepRepo.save(journeyStepRepo.create({
                journeyId: journey.id,
                title: s.title,
                contentType: s.type as any,
                delayDays: s.delay,
                orderIndex: s.order,
                mediaType: StepMediaType.NONE
            }));
        }
        journey = await journeyRepo.findOne({ where: { id: journey.id }, relations: ['steps'] });
    }

    // =========================================================================
    // 4. FORMS and FIELDS
    // =========================================================================
    console.log('📋 Generating Forms & Fields...');
    let forms = await formRepo.find({ where: { companyId } });

    // Define standard forms with fields
    const standardForms = [
        {
            title: 'Solicitação de Reembolso',
            description: 'Use para despesas de viagem.',
            fields: [
                { type: 'date', label: 'Data da Despesa', required: true },
                { type: 'number', label: 'Valor (R$)', required: true },
                { type: 'short_text', label: 'Motivo', required: true }
            ]
        },
        {
            title: 'Relato de Incidente de Segurança',
            description: 'Reporte situações de risco (NR-1).',
            fields: [
                { type: 'short_text', label: 'Local do Incidente', required: true },
                { type: 'long_text', label: 'Descrição do Ocorrido', required: true },
                { type: 'single_choice', label: 'Gravidade', options: { choices: ['Baixa', 'Média', 'Alta'] }, required: true }
            ]
        },
        {
            title: 'Feedback de Treinamento',
            description: 'Avalie o treinamento realizado.',
            fields: [
                { type: 'short_text', label: 'Nome do Treinamento', required: true },
                { type: 'stars', label: 'Avaliação Geral', required: true },
                { type: 'long_text', label: 'Sugestões', required: false }
            ]
        }
    ];

    for (const f of standardForms) {
        // Check if exists
        let existing = forms.find(ex => (ex.title as any)['pt-BR'] === f.title);
        if (!existing) {
            const form = formRepo.create({
                companyId,
                title: { "pt-BR": f.title },
                description: { "pt-BR": `Formulário de ${f.title}` },
                status: 'published',
                createdBy: authorId,
                visibility: 'public',
                publishedAt: randomDate(NINETY_DAYS_AGO, NOW),
                audienceSpaceIds: spaces.map(s => s.id), // All spaces
                audienceGroupIds: groupAll ? [groupAll.id] : [],
                allowMultipleSubmissions: true
            });
            existing = await formRepo.save(form);

            // Create fields
            let order = 1;
            for (const fieldDef of f.fields) {
                await formFieldRepo.save(formFieldRepo.create({
                    companyId,
                    formId: existing.id,
                    version: 1,
                    type: fieldDef.type as any,
                    label: { "pt-BR": fieldDef.label },
                    required: fieldDef.required,
                    options: (fieldDef as any).options || null,
                    order: order++
                }));
            }
        }
    }
    // Refresh forms list
    forms = await formRepo.find({ where: { companyId } });

    // =========================================================================
    // 5. SURVEYS
    // =========================================================================
    let surveys = await surveyRepo.find({ where: { companyId }, relations: ['questions'] });
    if (surveys.length === 0) {
        const survey = surveyRepo.create({
            companyId,
            title: 'Pesquisa Relâmpago',
            authorId,
            visibility: 'public',
            status: 'published',
            createdAt: randomDate(NINETY_DAYS_AGO, NOW),
            questions: [{ order: 1, type: 'nps' as any, questionText: 'Recomendaria a empresa?', isRequired: true }]
        });
        await surveyRepo.save(survey);
        surveys = await surveyRepo.find({ where: { companyId }, relations: ['questions'] });
    }


    // =========================================================================
    // 6. SIMULATE ENGAGEMENT & ANALYTICS (Distributed over 90 days)
    // =========================================================================
    console.log('⚡ SIMULATING ENGAGEMENT...');

    // A map to track XP per user to update user entity later
    const userXPMap: Record<string, number> = {};

    for (const user of targetUsers) {
        const userId = user.id;
        userXPMap[userId] = 0;

        // A. LOGIN HISTORY (Last Login)
        // Simulate logins over time to populate daily active users stats if they exist, or just last login
        // We'll set lastLoginAt to something recent for active users, but vary strictly
        const isRecentlyActive = Math.random() < 0.8;
        const lastLogin = isRecentlyActive ? randomDate(new Date(NOW.getTime() - 7 * 24 * 3600 * 1000), NOW) : randomDate(NINETY_DAYS_AGO, NOW);

        user.lastLoginAt = lastLogin;
        user.firstLoginAt = randomDate(NINETY_DAYS_AGO, new Date(NOW.getTime() - 60 * 24 * 3600 * 1000));
        await userRepo.save(user);

        // B. JOURNEYS (User Journey Instances)
        if (journey && journey.steps && journey.steps.length > 0 && Math.random() < 0.6) {
            const startedAt = randomDate(NINETY_DAYS_AGO, NOW);

            const progressRand = Math.random();
            let status = JourneyInstanceStatus.ACTIVE;
            let currentStepIndex = 0;
            let completedAt: Date | undefined = undefined;

            if (progressRand < 0.5) { // 50% Completed
                status = JourneyInstanceStatus.COMPLETED;
                currentStepIndex = journey.steps.length;
                completedAt = randomDate(startedAt, NOW);

                // Award XP for completion
                await xpRepo.save(xpRepo.create({
                    userId,
                    amount: 500,
                    actionType: GamificationActionType.JOURNEY_COMPLETION,
                    sourceId: journey.id,
                    description: 'Completed journey: ' + journey.title,
                    createdAt: completedAt
                }));
                userXPMap[userId] += 500;

            } else { // In Progress
                status = JourneyInstanceStatus.ACTIVE;
                currentStepIndex = randomInt(0, journey.steps.length - 1);
            }

            const instance = await userJourneyRepo.save(userJourneyRepo.create({
                companyId,
                userId,
                journeyId: journey.id,
                startDate: startedAt,
                currentStep: currentStepIndex,
                status: status as any,
                completedAt,
                notificationsSent: []
            }));

            // Create Step Completions & Award XP per step
            for (let i = 0; i < currentStepIndex; i++) {
                const step = journey.steps[i];
                if (step) {
                    const stepCompletedAt = randomDate(startedAt, completedAt || NOW);
                    await stepCompletionRepo.save(stepCompletionRepo.create({
                        instanceId: instance.id,
                        stepId: step.id,
                        completedAt: stepCompletedAt
                    }));

                    // XP per step
                    await xpRepo.save(xpRepo.create({
                        userId,
                        amount: 50,
                        actionType: GamificationActionType.JOURNEY_STEP,
                        sourceId: step.id,
                        description: 'Completed step: ' + step.title,
                        createdAt: stepCompletedAt
                    }));
                    userXPMap[userId] += 50;
                }
            }
        }

        // C. INTERACTIONS (Views)
        const eventCount = randomInt(5, 30);
        for (let i = 0; i < eventCount; i++) {
            const eventDate = randomDate(NINETY_DAYS_AGO, NOW);
            const randomNews = randomItem(newsList);
            if (randomNews) {
                await interactionRepo.save(interactionRepo.create({
                    companyId, userId,
                    newsId: randomNews.id,
                    type: 'OPEN',
                    createdAt: eventDate,
                    meta: { duration: randomInt(10, 300) }
                }));
            }
        }

        // D. NEWS INTERACTION (Likes, Comments, Shares)
        for (const item of newsList) {
            // Only interact if item was published before interaction
            const interactionDate = randomDate(item.createdAt, NOW);

            // 1. REACTION (Varied)
            if (Math.random() < 0.4) { // 40% chance
                const reactionType = randomItem(['like', 'love', 'clap', 'care', 'wow', 'sad']) || 'like';
                await reactionRepo.save(reactionRepo.create({
                    companyId,
                    newsId: item.id,
                    userId: userId,
                    reaction: reactionType,
                    createdAt: interactionDate
                } as any)).catch(() => { });
            }

            // 2. COMMENT (15%)
            if (Math.random() < 0.15) {
                await commentRepo.save(commentRepo.create({
                    companyId,
                    newsId: item.id,
                    userId: userId,
                    text: randomItem(COMMENTS) || "Muito bom!",
                    approved: true,
                    createdAt: interactionDate
                } as any));

                await xpRepo.save(xpRepo.create({
                    userId,
                    amount: 5,
                    actionType: GamificationActionType.NEWS_COMMENT,
                    sourceId: item.id,
                    description: 'Commented on news',
                    createdAt: interactionDate
                }));
                userXPMap[userId] += 5;
            }

            // 3. SHARE (5%)
            if (Math.random() < 0.05) {
                await shareRepo.save(shareRepo.create({
                    companyId,
                    newsId: item.id,
                    userId: userId,
                    platform: 'whatsapp',
                    createdAt: interactionDate
                } as any)).catch(() => { });
            }
        }

        // E. FORMS (Submissions & Daily Metrics)
        for (const form of forms) {
            if (Math.random() < 0.2) {
                const submitDate = randomDate(form.createdAt, NOW);
                const status = Math.random() < 0.7 ? 'approved' : 'submitted';

                // Create Submission
                const submission = await submissionRepo.save(submissionRepo.create({
                    formId: form.id, userId, companyId, formVersion: 1,
                    status: status as any, createdAt: submitDate, submittedAt: submitDate,
                    updatedAt: status === 'approved' ? randomDate(submitDate, NOW) : submitDate
                }));

                // Fetch fields for this form
                const fields = await formFieldRepo.find({ where: { formId: form.id } });

                // Create Answers
                for (const field of fields) {
                    let val: any = 'Resposta Teste';
                    if (field.type === 'number') val = randomInt(50, 5000);
                    if (field.type === 'date') val = new Date().toISOString().split('T')[0];
                    if (field.type === 'stars') val = randomInt(3, 5);
                    if (field.type === 'single_choice' && field.options?.choices) val = randomItem(field.options.choices);

                    await answerRepo.save(answerRepo.create({
                        companyId, submissionId: submission.id, formId: form.id, fieldId: field.id,
                        type: field.type, value: val, createdAt: submitDate
                    }));
                }

                await xpRepo.save(xpRepo.create({
                    userId, amount: 20, actionType: GamificationActionType.FORM_SUBMISSION,
                    sourceId: form.id, description: 'Form submitted', createdAt: submitDate
                }));
                userXPMap[userId] += 20;

                // Update Daily Metrics (Simplified: just increment submits for that day)
                const dateStr = submitDate.toISOString().split('T')[0];
                let metrics = await formMetricsRepo.findOne({ where: { formId: form.id, date: dateStr } });
                if (!metrics) {
                    metrics = formMetricsRepo.create({
                        companyId, formId: form.id, date: dateStr, submits: 0, internalSubmits: 0
                    });
                }
                metrics.submits += 1;
                metrics.internalSubmits += 1;
                await formMetricsRepo.save(metrics).catch(() => { });
            }
        }

        // F. SURVEY RESPONSES
        for (const survey of surveys) {
            if (Math.random() < 0.3) { // 30% participation
                const respDate = randomDate(survey.createdAt, NOW);
                const answers = survey.questions.map(q => ({
                    questionId: q.id,
                    answer: q.type === 'nps' ? randomInt(0, 10) : 'Resposta Simulada'
                }));

                await surveyResponseRepo.save(surveyResponseRepo.create({
                    survey,
                    userId,
                    answers: answers as any,
                    submittedAt: respDate
                }));

                // XP
                await xpRepo.save(xpRepo.create({
                    userId, amount: 10, actionType: GamificationActionType.SURVEY_COMPLETION,
                    sourceId: survey.id, description: 'Survey answered', createdAt: respDate
                }));
                userXPMap[userId] += 10;

                // Update daily metrics if needed (omitted for brevity, usually surveys use direct aggregation)
            }
        }
    }


    // ... inside user loop ...


    // UPDATE NEWS METRICS DAILY
    console.log('📊 Generating News Metrics...');
    // We need to aggregate all interactions by newsId + date
    const allInteractions = await interactionRepo.find();
    const allReactions = await reactionRepo.find();
    const allComments = await commentRepo.find();
    const allShares = await shareRepo.find();

    const newsMetricsMap = new Map<string, any>();
    const getNewsKey = (nid: string, d: string) => `${nid}_${d}`;

    const ensureMetric = (nid: string, d: string, companyId: string) => {
        const k = getNewsKey(nid, d);
        if (!newsMetricsMap.has(k)) {
            newsMetricsMap.set(k, {
                companyId, newsId: nid, date: d,
                opens: 0,
                reactions: 0, comments: 0, shares: 0
            });
        }
        return newsMetricsMap.get(k);
    };

    // Helper YMD (local to this block to avoid collision if already exists below in previous edits, but best to reuse. I'll declare it locally as const inside block scope if I could, but let's just use a distinct name to be safe)
    const getYMD_News = (d: Date) => d.toISOString().split('T')[0];

    for (const i of allInteractions) {
        if (!i.newsId) continue;
        const d = getYMD_News(i.createdAt);
        const m = ensureMetric(i.newsId, d, i.companyId);
        if (i.type === 'OPEN') m.opens++;
    }
    for (const r of allReactions) {
        const d = getYMD_News(r.createdAt);
        const m = ensureMetric(r.newsId, d, r.companyId);
        m.reactions++;
    }
    for (const c of allComments) {
        const d = getYMD_News(c.createdAt);
        const m = ensureMetric(c.newsId, d, c.companyId);
        m.comments++;
    }
    for (const s of allShares) {
        const d = getYMD_News(s.createdAt);
        const m = ensureMetric(s.newsId, d, s.companyId);
        m.shares++;
    }

    // Save News Metrics
    for (const m of newsMetricsMap.values()) {
        const existing = await newsMetricsRepo.findOne({ where: { newsId: m.newsId, date: m.date } });
        if (existing) {
            existing.opens += m.opens;
            existing.reactions += m.reactions;
            existing.comments += m.comments;
            existing.shares += m.shares;
            await newsMetricsRepo.save(existing);
        } else {
            await newsMetricsRepo.save(newsMetricsRepo.create(m));
        }
    }


    // UPDATE USER METRICS DAILY
    console.log('📊 Generating Daily Metrics...');
    const userMetricsRepo = AppDataSource.getRepository(UserMetricsDailyEntity);
    const engagedUserIds = Object.keys(userXPMap);

    for (const userId of engagedUserIds) {
        // Group interactions by date to update daily metrics
        const userEvents = await interactionRepo.find({ where: { userId } });
        const userNewsReactions = await reactionRepo.find({ where: { userId } });
        const userComments = await commentRepo.find({ where: { userId } });

        // Helper to get YYYY-MM-DD
        const getYMD = (d: Date) => d.toISOString().split('T')[0];

        const metricsMap = new Map<string, any>();

        // Process Interactions
        for (const e of userEvents) {
            const date = getYMD(e.createdAt);
            if (!metricsMap.has(date)) metricsMap.set(date, { userId, date, appOpens: 0, newsOpens: 0, newsUniqueOpens: 0, reactions: 0, comments: 0, shares: 0, surveyResponses: 0, favorites: 0 });
            const m = metricsMap.get(date);
            m.appOpens++;
            if (e.newsId) {
                m.newsOpens++;
                m.newsUniqueOpens++;
            }
        }

        // Process Reactions
        for (const r of userNewsReactions) {
            const date = getYMD(r.createdAt);
            if (!metricsMap.has(date)) metricsMap.set(date, { userId, date, appOpens: 0, newsOpens: 0, newsUniqueOpens: 0, reactions: 0, comments: 0, shares: 0, surveyResponses: 0, favorites: 0 });
            const m = metricsMap.get(date);
            m.reactions++;
        }

        // Process Comments
        for (const c of userComments) {
            const date = getYMD(c.createdAt);
            if (!metricsMap.has(date)) metricsMap.set(date, { userId, date, appOpens: 0, newsOpens: 0, newsUniqueOpens: 0, reactions: 0, comments: 0, shares: 0, surveyResponses: 0, favorites: 0 });
            const m = metricsMap.get(date);
            m.comments++;
        }

        // Save Metrics
        for (const m of metricsMap.values()) {
            const existing = await userMetricsRepo.findOne({ where: { userId, date: m.date } });
            if (existing) {
                existing.appOpens += m.appOpens;
                existing.newsOpens += m.newsOpens;
                existing.reactions += m.reactions;
                existing.comments += m.comments;
                await userMetricsRepo.save(existing);
            } else {
                await userMetricsRepo.save(userMetricsRepo.create(m));
            }
        }
    }

    // UPDATE USER XP
    console.log('🆙 Updating User XP Levels...');
    for (const [uid, xp] of Object.entries(userXPMap)) {
        if (xp > 0) {
            await userRepo.update(uid, { xp });
        }
    }


    // Helper to get YYYY-MM-DD








    // Save Metrics



    // UPDATE USER XP...


    console.log('✅ Simulation Complete!');
    await AppDataSource.destroy();
}

seed().catch((err) => {
    console.error('❌ Seed Failed:', err);
});
