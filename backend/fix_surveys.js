const fs = require('fs');
const { execSync } = require('child_process');

// Helper to get SQL result
function getSqlResult(query) {
    try {
        const safeQuery = query.replace(/"/g, '\\"');
        return execSync(`docker exec iuppy_postgres psql -U iuppy_admin -d iuppy_dev -t -c "${safeQuery}"`).toString().trim();
    } catch (e) {
        return '';
    }
}

function randomDate(daysAgo) {
    const now = new Date();
    const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime())).toISOString();
}

async function main() {
    console.log('📊 Fixing Survey Responses (File-based)...');

    const companyId = getSqlResult(`SELECT "companyId" FROM user_entity LIMIT 1`).trim();
    const surveyIds = getSqlResult(`SELECT id FROM survey WHERE "companyId"='${companyId}'`).split('\n').filter(s => s.trim());
    const allUserIds = getSqlResult(`SELECT id FROM user_entity WHERE "companyId"='${companyId}'`).split('\n').filter(s => s.trim());

    console.log(`Found ${surveyIds.length} surveys and ${allUserIds.length} users.`);

    let sqlContent = '';

    for (const sid of surveyIds) {
        const surveyId = sid.trim();
        const questionsJson = getSqlResult(`SELECT json_agg(json_build_object('id', id, 'type', type)) FROM survey_question WHERE "surveyId"='${surveyId}'`);
        let questions = [];
        try { questions = JSON.parse(questionsJson); } catch (e) { }

        if (questions && questions.length > 0) {
            const responders = allUserIds.sort(() => 0.5 - Math.random()).slice(0, 50);

            for (const uid of responders) {
                const submittedAt = randomDate(30);
                const answers = questions.map(q => {
                    let val = 'Opção 1';
                    if (q.type === 'nps') val = Math.floor(Math.random() * 11).toString();
                    else if (q.type === 'stars') val = Math.floor(Math.random() * 5 + 1).toString();
                    else if (q.type === 'text') val = 'Resposta simulada.';
                    return { questionId: q.id, value: val };
                });
                // No need to escape for shell, just for SQL string literal (single quotes)
                const answersJson = JSON.stringify(answers).replace(/'/g, "''");

                sqlContent += `INSERT INTO survey_response (id, "surveyId", "userId", "submittedAt", "answers") VALUES (gen_random_uuid(), '${surveyId}', '${uid.trim()}', '${submittedAt}', '${answersJson}');\n`;
            }
        }
    }

    if (sqlContent) {
        fs.writeFileSync('temp_surveys.sql', sqlContent);
        console.log('SQL file written. Executing...');
        try {
            execSync(`cat temp_surveys.sql | docker exec -i iuppy_postgres psql -U iuppy_admin -d iuppy_dev`);
            console.log('✅ SQL executed successfully.');
        } catch (e) {
            console.error('❌ SQL Execution failed:', e.message);
        }
        fs.unlinkSync('temp_surveys.sql');
    } else {
        console.log('No SQL to execute.');
    }
}

main();
