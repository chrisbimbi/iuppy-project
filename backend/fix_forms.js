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
    console.log('📝 Fixing Form Submissions & Answers (File-based)...');

    const companyId = getSqlResult(`SELECT "companyId" FROM user_entity LIMIT 1`).trim();
    const formIds = getSqlResult(`SELECT id FROM form WHERE "companyId"='${companyId}'`).split('\n').filter(s => s.trim());
    const allUserIds = getSqlResult(`SELECT id FROM user_entity WHERE "companyId"='${companyId}'`).split('\n').filter(s => s.trim());

    console.log(`Found ${formIds.length} forms and ${allUserIds.length} users.`);

    let sqlContent = '';
    // Cleanup
    sqlContent += `DELETE FROM form_answer;\n`;
    sqlContent += `DELETE FROM form_submission;\n`;

    for (const fid of formIds) {
        const formId = fid.trim();
        const fieldsJson = getSqlResult(`SELECT json_agg(json_build_object('id', id, 'type', type, 'options', options)) FROM form_field WHERE "formId"='${formId}'`);
        let fields = [];
        try { fields = JSON.parse(fieldsJson); } catch (e) { }

        if (fields && fields.length > 0) {
            // Generate 20 submissions
            const submitters = allUserIds.sort(() => 0.5 - Math.random()).slice(0, 20);

            for (const uid of submitters) {
                const submittedAt = randomDate(30);
                // Generate UUIDs in JS to link submission and answers
                // We can use a simple random UUID generator since we don't have uuid lib
                const submissionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });

                const status = Math.random() > 0.5 ? 'APPROVED' : (Math.random() > 0.5 ? 'REJECTED' : 'PENDING');

                // Insert Submission
                sqlContent += `INSERT INTO form_submission (id, "companyId", "formId", "formVersion", "submittedAt", "userId", "status", "createdAt", "updatedAt") VALUES ('${submissionId}', '${companyId}', '${formId}', 1, '${submittedAt}', '${uid.trim()}', '${status}', '${submittedAt}', '${submittedAt}');\n`;

                // Insert Answers
                for (const field of fields) {
                    let val = 'Resposta simulada';
                    if (field.type === 'date') val = '2025-11-20';
                    else if (field.type === 'number') val = Math.floor(Math.random() * 10).toString();
                    else if (field.type === 'single' || field.type === 'multiple') {
                        if (field.options && field.options.length > 0) {
                            val = field.options[0].id || 'option_1';
                        }
                    }
                    else if (field.type === 'image') val = 'https://picsum.photos/200/300';
                    else if (field.type === 'location') val = '-23.5505,-46.6333';

                    // Value must be JSON
                    const valJson = JSON.stringify(val).replace(/'/g, "''");

                    sqlContent += `INSERT INTO form_answer (id, "companyId", "submissionId", "formId", "fieldId", "type", "value", "createdAt") VALUES (gen_random_uuid(), '${companyId}', '${submissionId}', '${formId}', '${field.id}', '${field.type}', '${valJson}', '${submittedAt}');\n`;
                }
            }
        }
    }

    if (sqlContent) {
        fs.writeFileSync('temp_forms.sql', sqlContent);
        console.log('SQL file written. Executing...');
        try {
            execSync(`cat temp_forms.sql | docker exec -i iuppy_postgres psql -U iuppy_admin -d iuppy_dev`);
            console.log('✅ SQL executed successfully.');
        } catch (e) {
            console.error('❌ SQL Execution failed:', e.message);
        }
        fs.unlinkSync('temp_forms.sql');
    } else {
        console.log('No SQL to execute.');
    }
}

main();
