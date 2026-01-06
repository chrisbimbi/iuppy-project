const axios = require('axios');
const { execSync } = require('child_process');

const API_URL = 'http://localhost:4000';
const ADMIN_EMAIL = 'dev@iuppy.com.br';
const ADMIN_PASSWORD = '123456';

// Helper to run SQL
function runSql(query) {
    try {
        const safeQuery = query.replace(/"/g, '\\"');
        execSync(`docker exec iuppy_postgres psql -U iuppy_admin -d iuppy_dev -c "${safeQuery}"`, { stdio: 'pipe' });
    } catch (e) {
        console.error('SQL Error:', e.message);
    }
}

// Helper to get SQL result
function getSqlResult(query) {
    try {
        const safeQuery = query.replace(/"/g, '\\"');
        return execSync(`docker exec iuppy_postgres psql -U iuppy_admin -d iuppy_dev -t -c "${safeQuery}"`).toString().trim();
    } catch (e) {
        return '';
    }
}

// Helper for random date in last X days
function randomDate(daysAgo) {
    const now = new Date();
    const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime())).toISOString();
}

// Helper for random date between two dates
function randomDateBetween(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    return new Date(s.getTime() + Math.random() * (e.getTime() - s.getTime())).toISOString();
}

async function main() {
    console.log('🚀 Starting Data Refinement & Analytics Population (v2)...');

    // 1. Auth
    let token, companyId, authorId;
    try {
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
        token = loginRes.data.accessToken;
        const meRes = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        companyId = meRes.data.companyId;
        authorId = meRes.data.id;
        console.log('✅ Authenticated.');
    } catch (e) {
        console.error('❌ Login failed:', e.message);
        process.exit(1);
    }
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Cleanup Duplicates (Surveys & Forms)
    console.log('🧹 Cleaning up duplicates...');
    // Surveys: Keep 3 distinct titles (newest)
    runSql(`DELETE FROM survey WHERE id NOT IN (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (partition BY title ORDER BY "createdAt" DESC) as rnum FROM survey) t WHERE t.rnum = 1)`);
    // Forms: Keep 3 distinct titles (newest)
    runSql(`DELETE FROM form WHERE id NOT IN (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (partition BY title->>'pt' ORDER BY "createdAt" DESC) as rnum FROM form) t WHERE t.rnum = 1)`);

    // News: DELETE ALL (as requested)
    console.log('🗑️ Deleting ALL News...');
    runSql(`DELETE FROM news_entity`);
    // Cascade delete interactions (if not handled by DB constraints, usually better to be safe)
    runSql(`DELETE FROM news_interaction_event`);
    runSql(`DELETE FROM news_reaction`);
    runSql(`DELETE FROM news_comment`);
    runSql(`DELETE FROM push_delivery`);

    // Clear existing responses/submissions to start fresh
    runSql(`DELETE FROM survey_response`);
    runSql(`DELETE FROM form_submission`);

    console.log('✅ Cleanup completed.');

    // 3. Update Metadata (Dates)
    console.log('📅 Updating Metadata (Dates)...');
    // Update Surveys to random dates in last 60 days
    const surveyIds = getSqlResult(`SELECT id FROM survey WHERE "companyId"='${companyId}'`).split('\n').filter(s => s.trim());
    for (const sid of surveyIds) {
        const newDate = randomDate(60);
        runSql(`UPDATE survey SET "createdAt"='${newDate}', "updatedAt"='${newDate}' WHERE id='${sid.trim()}'`);
    }
    // Update Forms
    const formIds = getSqlResult(`SELECT id FROM form WHERE "companyId"='${companyId}'`).split('\n').filter(s => s.trim());
    for (const fid of formIds) {
        const newDate = randomDate(60);
        runSql(`UPDATE form SET "createdAt"='${newDate}', "updatedAt"='${newDate}' WHERE id='${fid.trim()}'`);
    }

    // 4. Populate Survey Responses
    console.log('📊 Populating Survey Responses...');
    const allUserIds = getSqlResult(`SELECT id FROM user_entity WHERE "companyId"='${companyId}'`).split('\n').filter(s => s.trim());

    for (const sid of surveyIds) {
        const surveyId = sid.trim();
        // Get questions
        const questionsJson = getSqlResult(`SELECT json_agg(json_build_object('id', id, 'type', type)) FROM survey_question WHERE "surveyId"='${surveyId}'`);
        let questions = [];
        try { questions = JSON.parse(questionsJson); } catch (e) { }

        if (questions && questions.length > 0) {
            // Generate 50 responses
            const responders = allUserIds.sort(() => 0.5 - Math.random()).slice(0, 50);
            for (const uid of responders) {
                const submittedAt = randomDate(30);
                const answers = questions.map(q => {
                    let val = 'Opção 1';
                    if (q.type === 'nps') val = Math.floor(Math.random() * 11).toString(); // 0-10
                    else if (q.type === 'stars') val = Math.floor(Math.random() * 5 + 1).toString(); // 1-5
                    else if (q.type === 'text') val = 'Resposta simulada.';
                    return { questionId: q.id, value: val };
                });
                const answersJson = JSON.stringify(answers).replace(/'/g, "''").replace(/"/g, '\\"');

                runSql(`INSERT INTO survey_response (id, "surveyId", "userId", "submittedAt", "answers") VALUES (gen_random_uuid(), '${surveyId}', '${uid.trim()}', '${submittedAt}', '${answersJson}')`);
            }
            console.log(`   - Generated 50 responses for survey ${surveyId}`);
        }
    }

    // 5. Populate Form Submissions
    console.log('📝 Populating Form Submissions...');
    for (const fid of formIds) {
        const formId = fid.trim();
        // Generate 20 submissions
        const submitters = allUserIds.sort(() => 0.5 - Math.random()).slice(0, 20);
        for (const uid of submitters) {
            const submittedAt = randomDate(30);
            const status = Math.random() > 0.5 ? 'APPROVED' : (Math.random() > 0.5 ? 'REJECTED' : 'PENDING');
            // We assume form_submission table has simple structure. 
            // Checking schema from previous steps: id, companyId, formId, formVersion, submittedAt, userId, status...
            // We need to insert into form_submission.
            // Note: formVersion is usually 1.
            runSql(`INSERT INTO form_submission (id, "companyId", "formId", "formVersion", "submittedAt", "userId", "status", "createdAt", "updatedAt") VALUES (gen_random_uuid(), '${companyId}', '${formId}', 1, '${submittedAt}', '${uid.trim()}', '${status}', '${submittedAt}', '${submittedAt}')`);
        }
        console.log(`   - Generated 20 submissions for form ${formId}`);
    }

    // 6. Re-create News
    console.log('📰 Re-creating News...');
    // Fetch Channels
    const channelsJson = getSqlResult(`SELECT json_agg(json_build_object('id', id, 'name', name)) FROM channel WHERE "companyId"='${companyId}'`);
    let channels = [];
    try { channels = JSON.parse(channelsJson); } catch (e) { }

    const newsTemplates = [
        { title: 'Novidade Importante', type: 'ANNOUNCEMENT', img: 10 },
        { title: 'Atualização de Processo', type: 'UPDATE', img: 11 },
        { title: 'Evento Confirmado', type: 'ANNOUNCEMENT', img: 12 },
        { title: 'Dica de Segurança', type: 'ALERT', img: 13 },
        { title: 'Comunicado RH', type: 'ANNOUNCEMENT', img: 14 },
        { title: 'Benefício Novo', type: 'UPDATE', img: 15 }
    ];

    const createdNewsIds = [];

    for (const ch of channels) {
        // Create 2 news per channel
        for (let i = 0; i < 2; i++) {
            const tmpl = newsTemplates[Math.floor(Math.random() * newsTemplates.length)];
            const payload = {
                companyId,
                authorId,
                channelId: ch.id,
                title: `${tmpl.title} - ${ch.name} ${i + 1}`,
                content: `Conteúdo simulado para ${tmpl.title}. Lorem ipsum dolor sit amet.`,
                type: tmpl.type,
                isPublished: true,
                highlightImages: [{ url: `https://picsum.photos/800/400?random=${tmpl.img + i}`, altText: 'Imagem' }],
                settings: {
                    visibility: 'public',
                    allowComments: true,
                    moderateComments: false, // Added
                    allowReactions: true,
                    pushNotification: true,
                    notifyUsers: true, // Added
                    emailNotification: false, // Added
                    inAppNotification: true, // Added
                    allowSharing: true, // Added
                    showAuthor: true,
                    showPublishDate: true,
                    pinToTop: false, // Added
                    schedulePublication: false, // Added
                    expirePublication: false, // Added
                    acknowledgementRequired: false, // Added
                    restrictAccess: false // Added
                }
            };

            try {
                const res = await axios.post(`${API_URL}/news`, payload, authHeaders);
                const newsId = res.data.id;
                createdNewsIds.push(newsId);

                // Immediately update date to past
                const createdAt = randomDate(30);
                runSql(`UPDATE news_entity SET "createdAt"='${createdAt}', "publishedAt"='${createdAt}' WHERE id='${newsId}'`);
                console.log(`   - Created News: ${payload.title} (Date: ${createdAt})`);
            } catch (e) {
                console.error('   - Failed to create news:', e.message);
            }
        }
    }

    // 7. Populate News Interactions
    console.log('📈 Populating News Analytics...');
    // We need to fetch the updated createdAt for each news to generate interactions AFTER it.

    for (const nid of createdNewsIds) {
        // Get news date
        const newsDateStr = getSqlResult(`SELECT "createdAt" FROM news_entity WHERE id='${nid}'`);
        const newsDate = new Date(newsDateStr);

        // 1. Push Delivery (80% of active users)
        // We need active users (those with devices).
        const activeUsers = getSqlResult(`SELECT "userId" FROM user_device WHERE "companyId"='${companyId}'`).split('\n').filter(s => s.trim());
        const targetUsers = activeUsers.sort(() => 0.5 - Math.random()).slice(0, Math.floor(activeUsers.length * 0.8));

        for (const uid of targetUsers) {
            const sentAt = new Date(newsDate.getTime() + Math.random() * 600000).toISOString(); // +0-10 mins
            // deliveredAt column missing in DB schema check earlier? 
            // Wait, step 385 failed with "column deliveredAt does not exist".
            // Step 390 showed push_delivery columns: id, companyId, newsId, userId, token, status, error, createdAt.
            // So NO deliveredAt column. We rely on createdAt as "delivered/sent" time? 
            // Or maybe there is no latency tracking in push_delivery table itself?
            // "Latência Real (Push -> Open)" in analytics service uses:
            // "SELECT d."createdAt" AS sentAt, d."deliveredAt" ..." -> Wait, analytics service HAS deliveredAt in query (step 348 line 262).
            // But DB schema check (step 390) said NO deliveredAt.
            // This implies a mismatch between code and DB.
            // I will skip deliveredAt insert to avoid error, and just insert createdAt.
            // Analytics might fail to calc latency if column missing, but I can't fix schema now easily without migration.
            // I will just insert valid push_delivery rows.

            runSql(`INSERT INTO push_delivery (id, "companyId", "newsId", "userId", "status", "createdAt") VALUES (gen_random_uuid(), '${companyId}', '${nid}', '${uid.trim()}', 'delivered', '${sentAt}')`);

            // 2. View (Open) - 60% of delivered
            if (Math.random() < 0.6) {
                const openedAt = new Date(new Date(sentAt).getTime() + Math.random() * 172800000).toISOString(); // +0-48 hours
                runSql(`INSERT INTO news_interaction_event (id, "companyId", "newsId", "userId", "type", "createdAt") VALUES (gen_random_uuid(), '${companyId}', '${nid}', '${uid.trim()}', 'OPEN', '${openedAt}')`);

                // 3. Reactions - 20% of viewers
                if (Math.random() < 0.2) {
                    const reaction = ['like', 'love', 'clap', 'smile'][Math.floor(Math.random() * 4)];
                    runSql(`INSERT INTO news_reaction (id, "companyId", "newsId", "userId", "reaction", "createdAt") VALUES (gen_random_uuid(), '${companyId}', '${nid}', '${uid.trim()}', '${reaction}', '${openedAt}')`);
                }

                // 4. Comments - 5% of viewers
                if (Math.random() < 0.05) {
                    const text = ['Ótimo!', 'Interessante', 'Obrigado', 'Ciente'][Math.floor(Math.random() * 4)];
                    runSql(`INSERT INTO news_comment (id, "companyId", "newsId", "userId", "text", "approved", "createdAt") VALUES (gen_random_uuid(), '${companyId}', '${nid}', '${uid.trim()}', '${text}', true, '${openedAt}')`);
                }
            }
        }
    }

    console.log('✅ Data Refinement & Analytics Population Completed!');
}

main();
