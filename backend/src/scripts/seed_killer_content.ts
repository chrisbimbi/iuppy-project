
import { AppDataSource } from '../config/data-source';
import { UserEntity } from '../users/user.entity';
import { CompanyEntity } from '../companies/company.entity';
import { Channel } from '../channels/channel.entity';
import { SpaceEntity } from '../spaces/space.entity';
import { NewsEntity } from '../news/news.entity';
import { JourneyEntity, JourneyTriggerType, JourneyRestartPolicy } from '../modules/journeys/entities/journey.entity';
import { JourneyStepEntity, StepContentType, StepMediaType } from '../modules/journeys/entities/journey-step.entity';
import { SurveyEntity, SurveyStatus, SurveyVisibility } from '../modules/surveys/entities/survey.entity';
import { SurveyQuestionEntity } from '../modules/surveys/entities/survey-question.entity';
import { FormEntity, FormStatus } from '../modules/forms/entities/form.entity';
import { FormFieldEntity } from '../modules/forms/entities/form-field.entity';
import { Nr1RiskRecord, RiskLevel, RiskStatus } from '../modules/nr1/entities/nr1-risk-record.entity';
import { Nr1RiskType } from '../modules/nr1/entities/nr1-risk-type.entity';

// We need Role enum.
import { Role } from '@shared/types';

async function seedKillerContent() {
    try {
        console.log('🚀 Initializing Data Source...');
        await AppDataSource.initialize();
        console.log('✅ Data Source Initialized.');

        // 1. TARGET SPECIFIC COMPANY
        const targetCompanyId = '2af4557f-9259-4eed-818d-1d0ffe0b8982';
        let company = await AppDataSource.getRepository(CompanyEntity).findOne({ where: { id: targetCompanyId } });

        if (!company) {
            console.log(`⚠️ Target Company ID ${targetCompanyId} NOT FOUND. Creating it...`);
            company = await AppDataSource.getRepository(CompanyEntity).save({
                id: targetCompanyId,
                name: 'Iuppy Demo (Killer Content)',
                description: 'Ambiente de demonstração criado automaticamente.',
                logo: 'https://via.placeholder.com/150',
                menuConfig: {}
            });
            console.log('✅ Company Created.');
        }

        // 2. ENSURE ADMIN USER
        const userRepo = AppDataSource.getRepository(UserEntity);
        let admin = await userRepo.findOne({ where: { companyId: company.id, role: Role.HRAdmin } });
        if (!admin) {
            admin = await userRepo.findOne({ where: { companyId: company.id } });
        }

        if (!admin) {
            console.log('⚠️ No Admin found. Creating default admin...');
            admin = await userRepo.save({
                companyId: company.id,
                name: 'Admin Demo',
                email: 'admin-demo-killer@iuppy.com', // Duplicate safe
                password: '$2b$10$EpOd/././././././././././',
                role: Role.HRAdmin,
                isActive: true,
                groups: []
            } as any);
            console.log('✅ Admin User Created (admin-demo-killer@iuppy.com).');
        }

        // 3. ENSURE SPACES & CHANNELS
        let spaces = await AppDataSource.getRepository(SpaceEntity).find({ where: { companyId: company.id } });
        if (spaces.length === 0) {
            console.log('Creating default Space...');
            const space = await AppDataSource.getRepository(SpaceEntity).save({
                companyId: company.id,
                name: 'Geral',
                slug: 'geral-demo', // UNIQUE SLUG
                description: 'Espaço principal',
                isPublic: true
            });
            spaces = [space];
        }
        const spaceIds = spaces.map(s => s.id);

        let channels = await AppDataSource.getRepository(Channel).find({ where: { companyId: company.id } });
        if (channels.length === 0) {
            console.log('Creating default Channel...');
            const channel = await AppDataSource.getRepository(Channel).save({
                companyId: company.id,
                name: 'Notícias Gerais',
                description: 'Canal oficial',
                type: 'articles', // FIXED ENUM
                spaceId: spaces[0]?.id
            } as any);
            channels = [channel];
        }


        console.log(`🏢 Seeding Content for: ${company.name} (${company.id}) | Admin: ${admin.name}`);

        // ==========================================
        // 2. NEWS
        // ==========================================
        console.log('📰 Seeding Killer News...');
        try {
            const newsRepo = AppDataSource.getRepository(NewsEntity);
            const killerNews = [
                {
                    title: '🚀 Atingimos 120% da Meta Global!',
                    content: '<p>Time, é com imenso orgulho que anunciamos: <strong>quebramos todas as barreiras!</strong></p><p>Fechamos o trimestre com 120% da meta atingida. Isso não é apenas um número, é a prova da nossa resiliência e capacidade de inovação.</p><p>Como reconhecimento, o bônus de performance será antecipado para todos os departamentos elegíveis.</p><br/><ul><li>Faturamento recorde</li><li>NPS de clientes em 92</li><li>Zero acidentes na planta fabril</li></ul><p>Vamos celebrar!</p>',
                },
                {
                    title: '🧘‍♂️ Novo Benefício: Gympass Platinum para Todos',
                    content: '<p>Acreditamos que alta performance só existe com saúde em dia.</p><p>A partir de hoje, todos os colaboradores (estagiários a diretoria) têm acesso ao plano <strong>Gympass Platinum</strong> sem custo adicional de coparticipação.</p><p>Isso inclui:</p><ul><li>Academias Premium</li><li>Apps de Meditação (Calm, Headspace)</li><li>Sessões de Terapia Online</li></ul><p>Cuidem-se. Nós cuidamos de vocês.</p>',
                },
                {
                    title: '💡 IPO à Vista? CEO fala sobre o futuro.',
                    content: '<p>Ontem tivemos uma das reuniões mais importantes da nossa história.</p><p>Nosso CEO reforçou que o caminho para o IPO (Oferta Pública Inicial) está sendo pavimentado com governança sólida e crescimento sustentável.</p><blockquote>"Não estamos construindo uma empresa para o próximo trimestre, estamos construindo um legado para os próximos 100 anos."</blockquote><p>Preparem-se para crescer acelerado.</p>',
                }
            ];

            for (const channel of channels) {
                for (const newsData of killerNews) {
                    const existing = await newsRepo.findOne({ where: { title: newsData.title, channelId: channel.id } });
                    if (existing) continue;

                    await newsRepo.save({
                        companyId: company.id,
                        authorId: admin.id,
                        channelId: channel.id,
                        title: newsData.title,
                        content: newsData.content,
                        isPublished: true,
                        settings: {
                            visibility: 'public',
                            allowComments: true,
                            moderateComments: false,
                            allowReactions: true,
                            notifyUsers: false,
                            pushNotification: false,
                            inAppNotification: false,
                            emailNotification: false,
                            acknowledgementRequired: false,
                            restrictAccess: false,
                            allowSharing: true,
                            showAuthor: true,
                            showPublishDate: true,
                            pinToTop: false,
                            schedulePublication: false,
                            expirePublication: false,
                            targetAudience: [],
                        },
                    } as any);
                }
            }

            // ✨ POPULATE NEWS_AUDIENCE for all users
            console.log('👥 Populating news_audience...');
            const allUsers = await AppDataSource.getRepository(UserEntity).find({ where: { companyId: company.id } });
            const allNews = await newsRepo.find({ where: { companyId: company.id, isPublished: true } });

            for (const news of allNews) {
                for (const user of allUsers) {
                    await AppDataSource.query(
                        `INSERT INTO news_audience ("companyId", "newsId", "userId")
                         VALUES ($1, $2, $3)
                         ON CONFLICT DO NOTHING`,
                        [company.id, news.id, user.id]
                    );
                }
            }
            console.log(`✅ Populated audience: ${allNews.length} news × ${allUsers.length} users`);
        } catch (e) { console.error('❌ Error Seeding News:', e); }


        // ==========================================
        // 3. JOURNEYS
        // ==========================================
        console.log('🗺️ Seeding Killer Journeys...');
        try {
            const journeyRepo = AppDataSource.getRepository(JourneyEntity);
            const stepRepo = AppDataSource.getRepository(JourneyStepEntity);

            let onboardingJourney = await journeyRepo.findOne({ where: { title: '🚀 Onboarding Estelar: Sua Primeira Semana', companyId: company.id } });
            if (!onboardingJourney) {
                onboardingJourney = await journeyRepo.save({
                    companyId: company.id,
                    title: '🚀 Onboarding Estelar: Sua Primeira Semana',
                    description: 'Tudo o que você precisa para decolar na sua carreira conosco.',
                    triggerType: JourneyTriggerType.ONBOARDING,
                    restartPolicy: JourneyRestartPolicy.RESUME,
                    active: true,
                    targetAudience: { all: true }
                });

                const onboardingSteps = [
                    {
                        title: 'Boas-vindas do CEO',
                        contentType: StepContentType.VIDEO,
                        mediaType: StepMediaType.VIDEO,
                        mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        videoConfig: { autoplay: true },
                        delayDays: 0,
                        orderIndex: 0
                    },
                    {
                        title: 'Nossa Cultura & Valores',
                        contentType: StepContentType.ARTICLE,
                        contentPayload: { body: '<h1>DNA da Inovação</h1><p>Conheça os pilares que sustentam nossa cultura de alta performance...</p>' },
                        delayDays: 0,
                        orderIndex: 1
                    },
                    {
                        title: 'Manual do Colaborador (PDF)',
                        contentType: StepContentType.ARTICLE,
                        contentPayload: { body: '<p>Baixe o manual aqui: <a href="https://example.com/manual.pdf">Manual 2024</a></p>' },
                        delayDays: 1,
                        orderIndex: 2
                    },
                    {
                        title: 'Quiz: Você prestou atenção?',
                        contentType: StepContentType.QUIZ,
                        quizConfig: {
                            questions: [
                                {
                                    id: 'q1', // Needs ID for scoring logic
                                    text: 'Qual nosso principal valor?',
                                    type: 'SINGLE_CHOICE',
                                    options: [
                                        { id: 'opt1', text: 'Inovação', isCorrect: true },
                                        { id: 'opt2', text: 'Burocracia', isCorrect: false }
                                    ],
                                    weight: 1
                                }
                            ],
                            passingScore: 70
                        },
                        delayDays: 2,
                        orderIndex: 3
                    },
                    {
                        title: 'Pesquisa: Como foi sua primeira semana?',
                        contentType: StepContentType.POLL,
                        pollConfig: {
                            surveyId: null, // Will be linked if needed, or standalone poll
                            allowSkip: true
                        },
                        delayDays: 5,
                        orderIndex: 4
                    }
                ];

                for (const step of onboardingSteps) {
                    await stepRepo.save({ ...step, journey: onboardingJourney });
                }
            }

            let carnivalJourney = await journeyRepo.findOne({ where: { title: '🎉 Carnaval da Firma: Concurso de Fantasias', companyId: company.id } });
            if (!carnivalJourney) {
                carnivalJourney = await journeyRepo.save({
                    companyId: company.id,
                    title: '🎉 Carnaval da Firma: Concurso de Fantasias',
                    description: 'Envie sua foto e concorra a um iPhone 15!',
                    triggerType: JourneyTriggerType.MANUAL,
                    active: true,
                    startDate: new Date(),
                    endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                });

                const carnivalSteps = [
                    {
                        title: 'O Desafio Começou!',
                        contentType: StepContentType.ARTICLE,
                        contentPayload: { body: '<h1>Prepare sua fantasia!</h1><p>Regras do concurso...</p>' },
                        delayDays: 0,
                        orderIndex: 0
                    },
                    {
                        title: 'Envie sua Foto',
                        contentType: StepContentType.FORM,
                        formConfig: { title: 'Upload da Fantasia' },
                        delayDays: 0,
                        orderIndex: 1
                    }
                ];
                for (const step of carnivalSteps) {
                    await stepRepo.save({ ...step, journey: carnivalJourney });
                }
            }
        } catch (e) { console.error('❌ Error Seeding Journeys:', e); }

        // ==========================================
        // 4. POLLS
        // ==========================================
        console.log('📊 Seeding Killer Polls...');
        try {
            const surveyRepo = AppDataSource.getRepository(SurveyEntity);
            const pollsData = [
                {
                    title: '🔮 Feedback Anual 2024',
                    description: 'Sua opinião molda nosso futuro.',
                    questions: [
                        { questionText: 'Como você avalia seu ano?', type: 'stars', order: 1, isRequired: true },
                        { questionText: 'O que podemos melhorar?', type: 'text', order: 2, isRequired: false },
                        { questionText: 'Avalie sua liderança direta', type: 'scale', order: 3, isRequired: true }
                    ]
                },
                {
                    title: '⚡ Pulse Check: eNPS',
                    description: 'Rapidinha: de 0 a 10.',
                    questions: [{ questionText: 'De 0 a 10, quanto você indicaria a empresa para um amigo?', type: 'nps', order: 1, isRequired: true }]
                },
                {
                    title: '🌡️ Pesquisa de Clima Q1',
                    description: 'Queremos ouvir você sobre o ambiente de trabalho.',
                    questions: [
                        { questionText: 'Sinto que tenho as ferramentas necessárias?', type: 'single', options: ['Sim', 'Não', 'Parcialmente'], order: 1, isRequired: true },
                        { questionText: 'O ambiente é colaborativo?', type: 'stars', order: 2, isRequired: true }
                    ]
                }
            ];

            for (const p of pollsData) {
                const existing = await surveyRepo.findOne({ where: { title: p.title, companyId: company.id } });
                if (existing) continue;

                const survey = surveyRepo.create({
                    companyId: company.id,
                    authorId: admin.id,
                    title: p.title,
                    description: p.description,
                    status: 'published',
                    visibility: 'public',
                    notifyUsers: true,
                    pushNotification: true,
                    spaceIds: spaceIds,
                    adminIds: [admin.id],
                } as any);
                const savedSurvey = await surveyRepo.save(survey);

                const qRepo = AppDataSource.getRepository(SurveyQuestionEntity);
                for (const q of p.questions) {
                    await qRepo.save({
                        ...q,
                        survey: (savedSurvey as unknown) as SurveyEntity,
                        type: q.type as any
                    });
                }
            }
        } catch (e) { console.error('❌ Error Seeding Polls:', e); }

        // ==========================================
        // 5. FORMS
        // ==========================================
        console.log('📝 Seeding Killer Forms...');
        try {
            const formRepo = AppDataSource.getRepository(FormEntity);
            const formFieldRepo = AppDataSource.getRepository(FormFieldEntity);
            const formsData = [
                {
                    title: '🏥 Envio de Atestado Médico',
                    fields: [
                        { label: { 'pt-BR': 'Data do Início do Afastamento' }, type: 'date', required: true, order: 1 },
                        { label: { 'pt-BR': 'Foto do Atestado' }, type: 'file_upload', required: true, order: 2 },
                        { label: { 'pt-BR': 'CID (Opcional)' }, type: 'text', required: false, order: 3 }
                    ]
                },
                {
                    title: '🗣️ Fale com o RH',
                    fields: [
                        { label: { 'pt-BR': 'Assunto' }, type: 'dropdown', options: { items: ['Dúvida Pagamento', 'Benefícios', 'Conflitos', 'Outros'] }, required: true, order: 1 },
                        { label: { 'pt-BR': 'Mensagem' }, type: 'textarea', required: true, order: 2 }
                    ]
                },
                {
                    title: '💰 Solicitação de Reembolso',
                    fields: [
                        { label: { 'pt-BR': 'Valor (R$)' }, type: 'number', required: true, order: 1 },
                        { label: { 'pt-BR': 'Comprovante Fiscal' }, type: 'file_upload', required: true, order: 2 },
                        { label: { 'pt-BR': 'Centro de Custo' }, type: 'text', required: true, order: 3 }
                    ]
                }
            ];

            for (const f of formsData) {
                const form = formRepo.create({
                    companyId: company.id,
                    createdBy: admin.id,
                    title: { 'pt-BR': f.title },
                    status: 'published',
                    visibility: 'public',
                    // audienceSpaceIds: spaceIds, // REMOVED (SCHEMA MISMATCH)
                    // allowMultipleSubmissions: true // REMOVED (SCHEMA MISMATCH)
                } as any);
                const savedForm = await formRepo.save(form);

                for (const field of f.fields) {
                    await formFieldRepo.save({
                        formId: (savedForm as any).id,
                        companyId: company.id,
                        label: field.label,
                        type: field.type as any,
                        required: field.required,
                        order: field.order,
                        options: (field as any).options || {}
                    });
                }
            }
        } catch (e) {
            console.error('❌ Error Seeding Forms:', e);
        }

        // ==========================================
        // 6. NR-1
        // ==========================================
        console.log('⚠️ Seeding NR-1 Risks...');
        try {
            const riskRepo = AppDataSource.getRepository(Nr1RiskRecord);
            const riskTypeRepo = AppDataSource.getRepository(Nr1RiskType);

            let riskType = await riskTypeRepo.findOne({ where: { company_id: company.id } });
            if (!riskType) {
                try {
                    riskType = await riskTypeRepo.save({
                        companyId: company.id,
                        name: 'Geral',
                        description: 'Riscos gerais da planta'
                    });
                } catch (e) { }
            }

            const risksData = [
                {
                    processo: 'Manuseio de Químicos',
                    ambiente: 'Laboratório Central',
                    atividade: 'Mistura de Reagentes',
                    perigo: 'Explosão / Queimadura Química',
                    fonte: 'Reação exotérmica descontrolada',
                    lesao: 'Queimaduras de 3º grau, perda de visão',
                    classificacao: RiskLevel.MUITO_ALTO,
                    medidas: [{ desc: 'Uso de Capela de Exaustão', status: 'implementado' }, { desc: 'EPI Completo (Tyvek)', status: 'implementado' }]
                },
                {
                    processo: 'Soldagem Industrial',
                    ambiente: 'Galpão de Montagem',
                    atividade: 'Solda TIG/MIG',
                    perigo: 'Fumos Metálicos',
                    fonte: 'Arco elétrico',
                    lesao: 'Intoxicação respiratória, febre dos fumos',
                    classificacao: RiskLevel.ALTO,
                    medidas: [{ desc: 'Máscara com filtro P3', status: 'implementado' }]
                },
                {
                    processo: 'Operação de Empilhadeira',
                    ambiente: 'Expedição',
                    atividade: 'Movimentação de Pallets',
                    perigo: 'Atropelamento',
                    fonte: 'Tráfego cruzado',
                    lesao: 'Esmagamento, fraturas múltiplas',
                    classificacao: RiskLevel.MEDIO,
                    medidas: [{ desc: 'Sinalização de solo', status: 'parcial' }]
                }
            ];

            for (const r of risksData) {
                const existing = await riskRepo.findOne({ where: { company_id: company.id, processo: r.processo, atividade: r.atividade } });
                if (existing) continue;

                await riskRepo.save({
                    company_id: company.id,
                    risk_type: riskType,
                    processo: r.processo,
                    ambiente: r.ambiente,
                    atividade: r.atividade,
                    perigo: r.perigo,
                    fonte_circunstancia: r.fonte,
                    possiveis_lesoes: r.lesao,
                    classificacao_risco: r.classificacao,
                    grupos_expostos: ['Operadores', 'Químicos'],
                    medidas_prevencao: r.medidas,
                    caracterizacao_exposicao: 'Habitual e Permanente',
                    status: RiskStatus.ATIVO,
                    space_id: null,
                    channel_id: null,
                    criterios_id: null
                });
            }
        } catch (e) {
            console.error('❌ Error Seeding NR-1:', e);
        }

        console.log('🎉 SEEDING COMPLETED SUCCESSFULLY! ENJOY YOUR KILLER CONTENT.');

    } catch (error) {
        console.error('❌ Fatal Error during seeding:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

seedKillerContent();
