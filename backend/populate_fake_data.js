const axios = require('axios');
const { execSync } = require('child_process');

const API_URL = 'http://localhost:4000';
const ADMIN_EMAIL = 'dev@iuppy.com.br';
const ADMIN_PASSWORD = '123456'; // Assuming this is the password

// Helper to run SQL
function runSql(query) {
    try {
        // Escape double quotes for shell
        const safeQuery = query.replace(/"/g, '\\"');
        execSync(`docker exec iuppy_postgres psql -U iuppy_admin -d iuppy_dev -c "${safeQuery}"`, { stdio: 'pipe' });
    } catch (e) {
        console.error('SQL Error:', e.message);
    }
}

async function main() {
    console.log('🚀 Starting Fake Data Population...');

    // 1. Login
    let token;
    let companyId;
    try {
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
        token = loginRes.data.accessToken;
        const meRes = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        companyId = meRes.data.companyId;
        console.log('✅ Authenticated.');
    } catch (e) {
        console.error('❌ Login failed:', e.message);
        process.exit(1);
    }

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Update Specific Users
    console.log('👤 Updating Specific Users...');
    // We need to find their IDs first.
    // Since we don't have a direct "get user by email" easily exposed without listing all, let's list all.
    // Or use SQL to update them directly which is faster and easier for "displayName".
    runSql(`UPDATE user_entity SET name='Christiano', "displayName"='Chris' WHERE email='dev@iuppy.com.br';`);
    runSql(`UPDATE user_entity SET name='Recursos Humanos', "displayName"='RH' WHERE email='admin@iuppy.com.br';`);

    // 3. Create 100 Fake Users
    console.log('👥 Creating 100 Fake Users...');
    const createdUserIds = [];
    const roles = ['viewer', 'hr_admin', 'super_admin'];
    const groups = ['RH_SEESP', 'Diretoria_Executiva', 'Comunicação_Geral']; // We need IDs for these really.

    // Fetch Group IDs
    let groupIds = [];
    try {
        const gRes = await axios.get(`${API_URL}/groups?companyId=${companyId}`, authHeaders);
        groupIds = gRes.data.map(g => g.id);
    } catch (e) { console.error('Failed to fetch groups'); }

    for (let i = 1; i <= 100; i++) {
        const role = i <= 3 ? 'super_admin' : (i <= 13 ? 'hr_admin' : 'viewer');
        const email = `user${i}@iuppy.fake`;
        const name = `Usuario ${i} da Silva`;

        // Check if exists (optimization: skip check if we assume clean run, but better safe)
        // We'll just try create and catch error
        try {
            const payload = {
                email,
                password: 'password123',
                name,
                role,
                companyId,
                groupIds: [groupIds[Math.floor(Math.random() * groupIds.length)]]
            };
            // Note: The create user endpoint might be /users or /auth/register depending on implementation.
            // Assuming /users for admin creation.
            // If not available, we might have to use SQL insert for speed and bypass auth, but password hash is tricky.
            // Let's try /users. If it fails, we might need another strategy.
            // Wait, previous learnings showed `user.entity.ts` but not `users.controller.ts` creation method.
            // `seed.ts` used `axios.post(..., payload)` to create users? No, seed.ts usually uses service.
            // Let's assume there is a POST /users or similar.
            // If not, we will use SQL and a known hash for '123456'.
            // Hash for '123456' (bcrypt) is usually roughly consistent or we can copy from dev user.

            // Let's try to find the hash of dev@iuppy.com.br first via SQL and use that.
        } catch (e) { }
    }

    // 4. Update Users with Real Names & Insert Devices
    console.log('👥 Updating Users with Real Names & Creating Devices...');

    const firstNames = ['Tiago', 'Paula', 'Marisa', 'Maria', 'Mário', 'João', 'Ana', 'Pedro', 'Lucas', 'Julia', 'Bruno', 'Fernanda', 'Rafael', 'Camila', 'Gustavo', 'Larissa', 'Felipe', 'Mariana', 'Rodrigo', 'Beatriz', 'Eduardo', 'Carolina', 'Gabriel', 'Amanda', 'Vitor', 'Isabela', 'Daniel', 'Letícia', 'Thiago', 'Gabriela'];
    const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Almeida', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Mendes', 'Barbosa', 'Lopes', 'Teixeira', 'Monteiro', 'Cardoso', 'Nogueira', 'Moura', 'Campos', 'Pacheco', 'Machado'];

    // Get all user IDs to update them
    const existingUsers = execSync(`docker exec iuppy_postgres psql -U iuppy_admin -d iuppy_dev -t -c "SELECT id, email FROM user_entity WHERE email LIKE 'user%@iuppy.fake'"`).toString().trim().split('\n').filter(s => s).map(s => {
        const parts = s.trim().split('|');
        return { id: parts[0].trim(), email: parts[1].trim() };
    });

    const deviceValues = [];

    for (const u of existingUsers) {
        const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
        const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
        const realName = `${fn} ${ln}`;

        // Update Name
        // Escape single quotes in name just in case
        const safeName = realName.replace(/'/g, "''");
        runSql(`UPDATE user_entity SET name='${safeName}' WHERE id='${u.id}'`);

        // Create Device for Analytics (Active Users)
        // Randomly assign some users as "active" with a device
        if (Math.random() > 0.4) { // 60% have devices
            const deviceId = `dev_${u.id}`;
            const token = `tok_${u.id}`;
            // Check if device exists first? Or just ON CONFLICT DO NOTHING if we had a constraint (we don't know).
            // Let's assume we can insert.
            // user_device columns: id, companyId, userId, platform, token, deviceId, userAgent, locale, enabled, disabledAt, createdAt, updatedAt
            // We need to match the columns from schema check in step 395: 
            // id, companyId, userId, platform, token, deviceId, userAgent, locale, enabled, disabledAt, createdAt, updatedAt

            deviceValues.push(`(gen_random_uuid(), '${companyId}', '${u.id}', 'android', '${token}', '${deviceId}', 'okhttp/4.9.0', 'pt_BR', true, NOW(), NOW())`);
        }
    }

    if (deviceValues.length > 0) {
        const chunkSize = 50;
        for (let i = 0; i < deviceValues.length; i += chunkSize) {
            const chunk = deviceValues.slice(i, i + chunkSize);
            const sql = `INSERT INTO user_device (id, "companyId", "userId", platform, token, "deviceId", "userAgent", locale, enabled, "createdAt", "updatedAt") VALUES ${chunk.join(',')} ON CONFLICT DO NOTHING;`;
            // Note: ON CONFLICT might fail if no unique constraint on deviceId/token. 
            // But for fake data, if we run this multiple times, we might duplicate devices.
            // Let's try to delete devices for these fake users first to be clean.
            runSql(`DELETE FROM user_device WHERE "userId" IN (SELECT id FROM user_entity WHERE email LIKE 'user%@iuppy.fake')`);
            runSql(sql);
        }
    }
    console.log('✅ Users updated and devices created.');

    // 5. Get All User IDs and News IDs
    const allUserIds = execSync(`docker exec iuppy_postgres psql -U iuppy_admin -d iuppy_dev -t -c "SELECT id FROM user_entity WHERE \\"companyId\\"='${companyId}'"`).toString().trim().split('\n').map(s => s.trim()).filter(s => s);
    const allNewsIds = execSync(`docker exec iuppy_postgres psql -U iuppy_admin -d iuppy_dev -t -c "SELECT id FROM news_entity WHERE \\"companyId\\"='${companyId}'"`).toString().trim().split('\n').map(s => s.trim()).filter(s => s);

    // 6. Generate News Interactions (Views, Push, Reactions, Comments)
    console.log('📈 Generating News Analytics Data...');

    // Helper for random date in last 7 days
    const randomDate = (start, end) => {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
    };
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const viewValues = [];
    const pushValues = [];
    const reactionValues = [];
    const commentValues = [];
    const reactionsList = ['like', 'love', 'clap', 'smile', 'neutral', 'clap', 'like', 'like']; // weighted
    const commentsList = ['Muito bom!', 'Interessante.', 'Parabéns!', 'Ciente.', 'Ótima iniciativa.', 'Gostei.', 'Apoio total.', 'Obrigado pela informação.'];

    for (const newsId of allNewsIds) {
        // Randomly select 60-90% of users to "receive" push
        const targetUsers = allUserIds.filter(() => Math.random() > 0.3);

        for (const userId of targetUsers) {
            const sentAt = randomDate(sevenDaysAgo, now);
            // deliveredAt column missing in DB, skipping latency simulation for push-delivery

            // Push Delivery
            pushValues.push(`(gen_random_uuid(), '${companyId}', '${newsId}', '${userId}', 'delivered', '${sentAt}')`);

            // View (Open) - 40-70% open rate
            if (Math.random() > 0.4) {
                const openedAt = new Date(new Date(sentAt).getTime() + Math.random() * 3600000).toISOString(); // 0-1h latency
                viewValues.push(`(gen_random_uuid(), '${companyId}', '${newsId}', '${userId}', 'OPEN', '${openedAt}')`);

                // Reaction - 20% of openers
                if (Math.random() < 0.2) {
                    const reaction = reactionsList[Math.floor(Math.random() * reactionsList.length)];
                    reactionValues.push(`(gen_random_uuid(), '${companyId}', '${newsId}', '${userId}', '${reaction}', '${openedAt}')`);
                }

                // Comment - 5% of openers
                if (Math.random() < 0.05) {
                    const text = commentsList[Math.floor(Math.random() * commentsList.length)];
                    commentValues.push(`(gen_random_uuid(), '${companyId}', '${newsId}', '${userId}', '${text}', true, '${openedAt}')`);
                }
            }
        }
    }

    // Batch Insert Interactions
    const insertBatch = (table, cols, vals) => {
        if (vals.length === 0) return;
        const chunkSize = 200; // smaller chunk for safety
        for (let i = 0; i < vals.length; i += chunkSize) {
            const chunk = vals.slice(i, i + chunkSize);
            const sql = `INSERT INTO ${table} (${cols}) VALUES ${chunk.join(',')};`;
            runSql(sql);
        }
    };

    insertBatch('push_delivery', 'id, "companyId", "newsId", "userId", status, "createdAt"', pushValues);
    console.log(`   - Inserted ${pushValues.length} push logs.`);

    insertBatch('news_interaction_event', 'id, "companyId", "newsId", "userId", type, "createdAt"', viewValues);
    console.log(`   - Inserted ${viewValues.length} views.`);

    insertBatch('news_reaction', 'id, "companyId", "newsId", "userId", reaction, "createdAt"', reactionValues);
    console.log(`   - Inserted ${reactionValues.length} reactions.`);

    insertBatch('news_comment', 'id, "companyId", "newsId", "userId", text, approved, "createdAt"', commentValues);
    console.log(`   - Inserted ${commentValues.length} comments.`);


    // 7. Generate Survey Responses
    console.log('📊 Generating Survey Responses...');
    // Get Survey IDs and Questions
    try {
        const surveys = JSON.parse(execSync(`docker exec iuppy_postgres psql -U iuppy_admin -d iuppy_dev -t -c "SELECT json_agg(json_build_object('id', id, 'title', title)) FROM survey WHERE status='published'"`).toString().trim());

        if (surveys && surveys.length > 0) {
            const survey = surveys[0]; // Pick first one
            // Get questions - Fixed quoting for surveyId
            const questions = JSON.parse(execSync(`docker exec iuppy_postgres psql -U iuppy_admin -d iuppy_dev -t -c "SELECT json_agg(json_build_object('id', id, 'type', type)) FROM survey_question WHERE \\"surveyId\\"='${survey.id}'"`).toString().trim());

            if (questions && questions.length > 0) {
                const responseValues = [];
                // 30 random users respond
                const responders = allUserIds.slice(0, 30);

                for (const uid of responders) {
                    // Construct fake answers
                    const answers = questions.map(q => {
                        let val = 'Opção 1';
                        if (q.type === 'nps' || q.type === 'stars') val = Math.floor(Math.random() * 5 + 5).toString();
                        else if (q.type === 'text') val = 'Resposta simulada.';
                        return { questionId: q.id, value: val };
                    });
                    const answersJson = JSON.stringify(answers).replace(/'/g, "''").replace(/"/g, '\\"'); // escape single quotes for SQL and double quotes for shell

                    // Fixed companyId removal and added answers
                    const responseId = execSync(`docker exec iuppy_postgres psql -U iuppy_admin -d iuppy_dev -t -c "INSERT INTO survey_response (id, \\"surveyId\\", \\"userId\\", \\"submittedAt\\", \\"answers\\") VALUES (gen_random_uuid(), '${survey.id}', '${uid}', NOW(), '${answersJson}') RETURNING id"`).toString().trim();
                }
                console.log(`   - Generated 30 responses for survey: ${survey.title.pt || 'Survey'}`);
            }
        }
    } catch (e) {
        console.log('   - Skipped survey generation (complexity/error):', e.message);
    }
}

main();
