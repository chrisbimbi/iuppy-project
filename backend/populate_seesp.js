const axios = require('axios');

const API_URL = 'http://localhost:4000';
const ADMIN_EMAIL = 'dev@iuppy.com.br';
const ADMIN_PASSWORD = '123456';

async function main() {
    try {
        console.log('🚀 Starting SEESP Data Population...');

        // 1. Authentication
        console.log('🔑 Authenticating...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
        });
        const accessToken = loginRes.data.accessToken;

        const authHeaders = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };

        const meRes = await axios.get(`${API_URL}/auth/me`, authHeaders);
        const user = meRes.data;
        const companyId = user.companyId;
        const authorId = user.id;

        console.log(`✅ Authenticated. CompanyID: ${companyId}, UserID: ${authorId}`);

        // 2. Create Groups
        console.log('👥 Creating Groups...');
        const groupsData = [
            { name: 'RH_SEESP', type: 'INTERNAL', companyId },
            { name: 'Diretoria_Executiva', type: 'INTERNAL', companyId },
            { name: 'Comunicação_Geral', type: 'OPEN', companyId },
        ];

        // Fetch existing groups
        const existingGroupsRes = await axios.get(`${API_URL}/groups?companyId=${companyId}`, authHeaders);
        const existingGroups = existingGroupsRes.data;

        const groups = [];
        for (const g of groupsData) {
            const existing = existingGroups.find(eg => eg.name === g.name);
            if (existing) {
                groups.push(existing);
                console.log(`   - Group already exists: ${g.name}`);
            } else {
                try {
                    const res = await axios.post(`${API_URL}/groups`, g, authHeaders);
                    groups.push(res.data);
                    console.log(`   - Created Group: ${g.name}`);
                } catch (e) {
                    console.error(`   - Failed to create group ${g.name}:`, e.response?.data || e.message);
                }
            }
        }

        // 3. Create Spaces
        console.log('🪐 Creating Spaces...');
        const spacesData = [
            { name: 'SEESP: Geral', slug: 'seesp-geral', active: true, companyId },
            { name: 'Desenvolvimento Profissional', slug: 'dev-prof', active: true, companyId },
            { name: 'Serviços e Utilidades', slug: 'servicos', active: true, companyId },
        ];

        // Fetch existing spaces
        const existingSpacesRes = await axios.get(`${API_URL}/spaces?companyId=${companyId}`, authHeaders);
        const existingSpaces = existingSpacesRes.data;
        const spaces = {};

        for (const s of spacesData) {
            const existing = existingSpaces.find(es => es.slug === s.slug);
            if (existing) {
                spaces[s.slug] = existing;
                console.log(`   - Space already exists: ${s.name}`);
            } else {
                try {
                    const res = await axios.post(`${API_URL}/spaces`, s, authHeaders);
                    spaces[s.slug] = res.data;
                    console.log(`   - Created Space: ${s.name}`);
                } catch (e) {
                    console.error(`   - Failed to create space ${s.name}:`, e.response?.data || e.message);
                }
            }
        }

        // 4. Create Channels
        console.log('📺 Creating Channels...');
        const channelsData = [
            { name: 'Informes Legais & Normas', type: 'updates', companyId, spaceSlug: 'seesp-geral' },
            { name: 'Vida no Sindicato & Cultura', type: 'updates', companyId, spaceSlug: 'seesp-geral' },
            { name: 'Capacitação & Eventos', type: 'updates', companyId, spaceSlug: 'dev-prof' },
            { name: 'Módulos e Formulários', type: 'updates', companyId, spaceSlug: 'servicos' },
        ];

        // Fetch existing channels (need to fetch by space or just list all if possible, or try create and catch 409/check name)
        // Since we don't have a simple "list all channels" endpoint without spaceId usually, we'll iterate spaces.
        // Actually, let's just try to find them in the spaces we have.
        const channels = [];

        for (const c of channelsData) {
            const space = spaces[c.spaceSlug];
            if (!space) {
                console.warn(`   - Skipping channel ${c.name}, space ${c.spaceSlug} not found.`);
                continue;
            }

            // List channels in this space to check existence
            let existingChannel = null;
            try {
                const cRes = await axios.get(`${API_URL}/channels?spaceId=${space.id}`, authHeaders);
                existingChannel = cRes.data.find(ch => ch.name === c.name);
            } catch (e) { }

            if (existingChannel) {
                channels.push({ ...existingChannel, _refName: c.name });
                console.log(`   - Channel already exists: ${c.name}`);
            } else {
                try {
                    const payload = { ...c, spaceIds: [space.id], isPublished: true };
                    delete payload.spaceSlug;

                    const res = await axios.post(`${API_URL}/channels`, payload, authHeaders);
                    channels.push({ ...res.data, _refName: c.name });
                    console.log(`   - Created Channel: ${c.name}`);
                } catch (e) {
                    console.error(`   - Failed to create channel ${c.name}:`, e.response?.data || e.message);
                }
            }
        }

        // 5. Create News
        console.log('📰 Creating News...');

        // Delete existing news to avoid duplicates
        try {
            await axios.delete(`${API_URL}/news/test-cleanup?companyId=${companyId}`, authHeaders).catch(() => { });
            // Note: Since we don't have a bulk delete endpoint exposed easily, we'll rely on the script being idempotent or the user accepting we might have to clear via SQL if needed. 
            // Actually, let's use the SQL approach via docker exec for reliability in this script context if possible, but since this is a JS script, we'll just proceed.
            // BETTER APPROACH: We will just create them. If duplicates exist, we might want to clear them first via SQL in the terminal.
            // Let's assume the user wants us to handle it. I will add a SQL delete command in the script execution flow via the agent tools, but here in the script, I will just define the data.
        } catch (e) { }

        const newsItems = [
            // C1: Informes Legais
            {
                channelName: 'Informes Legais & Normas',
                title: 'Reajuste Salarial 2025',
                content: 'Informamos que o reajuste salarial da categoria foi aprovado...',
                type: 'ANNOUNCEMENT',
                highlightImages: [{ url: 'https://picsum.photos/800/400?random=1', altText: 'Reajuste Salarial' }],
                settings: { pushNotification: true, acknowledgementRequired: true }
            },
            {
                channelName: 'Informes Legais & Normas',
                title: 'Alerta: Prazo Imposto de Renda',
                content: 'Engenheiro, fique atento ao prazo final para declaração...',
                type: 'ALERT',
                highlightImages: [{ url: 'https://picsum.photos/800/400?random=2', altText: 'Imposto de Renda' }],
                settings: { pushNotification: true, acknowledgementRequired: true }
            },
            {
                channelName: 'Informes Legais & Normas',
                title: 'Nova Norma ABNT NBR 12345',
                content: 'Foi publicada a nova norma técnica referente a...',
                type: 'UPDATE',
                highlightImages: [{ url: 'https://picsum.photos/800/400?random=3', altText: 'Norma ABNT' }],
                settings: { pushNotification: true }
            },
            // C2: Vida no Sindicato
            {
                channelName: 'Vida no Sindicato & Cultura',
                title: 'Parabéns aos Aniversariantes de Novembro',
                content: 'Desejamos muitas felicidades aos nossos colegas...',
                type: 'UPDATE',
                highlightImages: [{ url: 'https://picsum.photos/800/400?random=4', altText: 'Aniversariantes' }],
                settings: { pushNotification: true }
            },
            {
                channelName: 'Vida no Sindicato & Cultura',
                title: 'Concurso de Decoração de Natal',
                content: 'Participe do nosso concurso anual de decoração...',
                type: 'ANNOUNCEMENT',
                highlightImages: [{ url: 'https://picsum.photos/800/400?random=5', altText: 'Natal' }],
                settings: { pushNotification: true }
            },
            {
                channelName: 'Vida no Sindicato & Cultura',
                title: 'Fechamento de Fim de Ano',
                content: 'Confira nosso expediente durante as festas...',
                type: 'ANNOUNCEMENT',
                highlightImages: [{ url: 'https://picsum.photos/800/400?random=6', altText: 'Fim de Ano' }],
                settings: { pushNotification: true }
            },
            // C3: Capacitação
            {
                channelName: 'Capacitação & Eventos',
                title: 'Workshop: IA na Engenharia',
                content: 'Inscreva-se no workshop prático sobre uso de IA...',
                type: 'ANNOUNCEMENT',
                highlightImages: [{ url: 'https://picsum.photos/800/400?random=7', altText: 'Workshop IA' }],
                settings: { pushNotification: true }
            },
            {
                channelName: 'Capacitação & Eventos',
                title: 'Novo Convênio: USP/Poli',
                content: 'Associados agora têm desconto em cursos de pós...',
                type: 'UPDATE',
                highlightImages: [{ url: 'https://picsum.photos/800/400?random=8', altText: 'USP Poli' }],
                settings: { pushNotification: true }
            },
            {
                channelName: 'Capacitação & Eventos',
                title: 'Congresso Anual do SEESP',
                content: 'Save the date! O congresso acontecerá em...',
                type: 'ANNOUNCEMENT',
                highlightImages: [{ url: 'https://picsum.photos/800/400?random=9', altText: 'Congresso' }],
                settings: { pushNotification: true }
            },
        ];

        for (const n of newsItems) {
            try {
                const channel = channels.find(c => c._refName === n.channelName);
                if (!channel) {
                    console.warn(`   - Skipping news ${n.title}, channel ${n.channelName} not found.`);
                    continue;
                }

                const payload = {
                    companyId,
                    authorId,
                    channelId: channel.id,
                    title: n.title,
                    content: n.content,
                    type: n.type,
                    isPublished: true,
                    highlightImages: n.highlightImages, // Added images
                    settings: {
                        visibility: 'public',
                        allowComments: true,
                        allowReactions: true,
                        notifyUsers: false,
                        pushNotification: n.settings.pushNotification || false,
                        emailNotification: false,
                        allowSharing: true,
                        showAuthor: true,
                        showPublishDate: true,
                        pinToTop: false,
                        schedulePublication: false,
                        expirePublication: false,
                        pushTitle: n.title,
                        pushContent: n.content.substring(0, 50),
                        targetAudience: [],
                        // Missing fields fixed:
                        moderateComments: false,
                        inAppNotification: true,
                        restrictAccess: false,
                        acknowledgementRequired: false,
                        ...n.settings
                    }
                };

                await axios.post(`${API_URL}/news`, payload, authHeaders);
                console.log(`   - Created News: ${n.title}`);
            } catch (e) {
                console.error(`   - Failed to create news ${n.title}:`, e.response?.data || e.message);
            }
        }

        // 6. Create Forms
        console.log('📝 Creating Forms...');
        const formsData = [
            {
                title: { pt: 'Envio de Atestado Médico' },
                attachmentHelpText: { pt: 'Por favor, anexe uma foto legível do seu atestado médico.' },
                requiresApproval: true,
                fields: [
                    { type: 'text', label: { pt: 'Nome Completo' }, required: true, order: 1 },
                    { type: 'date', label: { pt: 'Data de Início da Ausência' }, required: true, order: 2 },
                    { type: 'date', label: { pt: 'Data de Retorno' }, required: true, order: 3 },
                    { type: 'number', label: { pt: 'Quantidade de Dias' }, required: true, order: 4 },
                    {
                        type: 'single',
                        label: { pt: 'Motivo da Ausência' },
                        required: true,
                        order: 5,
                        options: [
                            { id: 'doenca', label: { pt: 'Doença' } },
                            { id: 'acompanhamento', label: { pt: 'Acompanhamento Familiar' } },
                            { id: 'exame', label: { pt: 'Exame' } },
                            { id: 'outros', label: { pt: 'Outros' } }
                        ]
                    }
                ]
            },
            {
                title: { pt: 'Campanha de Natal: Decoração' },
                attachmentHelpText: { pt: 'Mostre sua decoração para todos!' },
                requiresApproval: false,
                fields: [
                    { type: 'text', label: { pt: 'Título da Decoração' }, required: true, order: 1 },
                    { type: 'image', label: { pt: 'Foto' }, required: true, order: 2 }
                ]
            },
            {
                title: { pt: 'Relatório de Segurança' },
                attachmentHelpText: { pt: 'Anexe fotos do local ou da situação de risco, se houver.' },
                requiresApproval: true,
                fields: [
                    {
                        type: 'single',
                        label: { pt: 'Tipo de Ocorrência' },
                        required: true,
                        order: 1,
                        options: [
                            { id: 'acidente', label: { pt: 'Acidente' } },
                            { id: 'quase_acidente', label: { pt: 'Quase Acidente (Near Miss)' } },
                            { id: 'condicao_insegura', label: { pt: 'Condição Insegura' } }
                        ]
                    },
                    {
                        type: 'single',
                        label: { pt: 'Gravidade' },
                        required: true,
                        order: 2,
                        options: [
                            { id: 'baixa', label: { pt: 'Baixa' } },
                            { id: 'media', label: { pt: 'Média' } },
                            { id: 'alta', label: { pt: 'Alta' } }
                        ]
                    },
                    { type: 'text', label: { pt: 'Descrição Detalhada do Evento' }, required: true, order: 3 },
                    { type: 'location', label: { pt: 'Localização da Ocorrência' }, required: true, order: 4 },
                    { type: 'text', label: { pt: 'Testemunhas (Opcional)' }, required: false, order: 5 }
                ]
            }
        ];
        for (const f of formsData) {
            try {
                const payload = {
                    companyId,
                    title: f.title,
                    status: 'published',
                    fields: f.fields,
                    allowMultipleSubmissions: true,
                    anonymous: false,
                    attachmentsAllowed: true,
                    requiresApproval: f.requiresApproval || false,
                    attachmentHelpText: f.attachmentHelpText || null
                };
                await axios.post(`${API_URL}/forms?companyId=${companyId}`, payload, authHeaders);
                console.log(`   - Created Form: ${f.title.pt}`);
            } catch (e) {
                console.error(`   - Failed to create form ${f.title.pt}:`, e.response?.data || e.message);
            }
        }

        // 7. Create Surveys
        console.log('📊 Creating Surveys...');
        const surveysData = [
            {
                title: 'Pesquisa Rápida: Satisfação (NPS)',
                questions: [
                    { type: 'nps', questionText: 'Qual a probabilidade de você recomendar o sindicato?', order: 1, isRequired: true }
                ]
            },
            {
                title: 'Feedback Evento Final de Ano',
                questions: [
                    { type: 'stars', questionText: 'Como você avalia o evento?', order: 1, isRequired: true },
                    { type: 'text', questionText: 'Comentários adicionais', order: 2, isRequired: false }
                ]
            },
            {
                title: 'Prioridades de Capacitação 2026',
                questions: [
                    {
                        type: 'single',
                        questionText: 'Quais temas você prefere?',
                        order: 1,
                        isRequired: true,
                        options: ['IA', 'Sustentabilidade', 'Gestão de Projetos', 'Normas Técnicas']
                    }
                ]
            }
        ];

        // Need Space ID for surveys
        const spaceS3 = spaces['servicos'];
        if (spaceS3) {
            for (const s of surveysData) {
                try {
                    // 1. Create Survey
                    const surveyPayload = {
                        companyId,
                        title: s.title,
                        authorId,
                        adminIds: [authorId],
                        spaceIds: [spaceS3.id],
                        visibility: 'public',
                        notifyUsers: true,
                        emailNotification: false,
                        inAppNotification: true,
                        pushNotification: true,
                        acknowledgementRequired: false,
                        scheduleSurvey: false,
                        expireSurvey: false,
                        isAnonymous: false,
                        status: 'published'
                    };

                    const surveyRes = await axios.post(`${API_URL}/modules/${companyId}/surveys`, surveyPayload, authHeaders);
                    const surveyId = surveyRes.data.id;
                    console.log(`   - Created Survey: ${s.title}`);

                    // 2. Add Questions
                    for (const q of s.questions) {
                        const qPayload = { ...q };
                        await axios.post(`${API_URL}/modules/${companyId}/surveys/${surveyId}/questions`, qPayload, authHeaders);
                    }
                    console.log(`     - Added ${s.questions.length} questions.`);

                } catch (e) {
                    console.error(`   - Failed to create survey ${s.title}:`, e.response?.data || e.message);
                }
            }
        } else {
            console.warn('   - Skipping Surveys: Space "Serviços e Utilidades" not found.');
        }

        console.log('✅ SEESP Data Population Completed!');

    } catch (error) {
        console.error('❌ Fatal Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

main();
