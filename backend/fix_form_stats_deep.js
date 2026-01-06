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
    console.log('📉 Fixing Deep Form Stats (Events & Actions)...');

    const companyId = getSqlResult(`SELECT "companyId" FROM user_entity LIMIT 1`).trim();
    const formIds = getSqlResult(`SELECT id FROM form WHERE "companyId"='${companyId}'`).split('\n').filter(s => s.trim());

    let sqlContent = '';

    // Clear existing to avoid duplicates if re-run
    sqlContent += `DELETE FROM form_event;\n`;
    sqlContent += `DELETE FROM form_rh_action;\n`;

    for (const fid of formIds) {
        const formId = fid.trim();
        const fieldsJson = getSqlResult(`SELECT json_agg(json_build_object('id', id)) FROM form_field WHERE "formId"='${formId}'`);
        let fields = [];
        try { fields = JSON.parse(fieldsJson); } catch (e) { }

        // Get submissions for this form to link RH actions
        const submissionsJson = getSqlResult(`SELECT json_agg(json_build_object('id', id, 'userId', "userId", 'submittedAt', "submittedAt")) FROM form_submission WHERE "formId"='${formId}'`);
        let submissions = [];
        try { submissions = JSON.parse(submissionsJson); } catch (e) { }

        if (submissions && submissions.length > 0) {
            for (const sub of submissions) {
                // 1. RH Actions (for 80% of submissions)
                if (Math.random() < 0.8) {
                    const actionDate = new Date(new Date(sub.submittedAt).getTime() + Math.random() * 86400000).toISOString(); // +0-24h
                    const type = Math.random() > 0.5 ? 'APPROVE' : 'REJECT';
                    // form_rh_action columns: id, companyId, formId, submissionId, actorUserId, type, message, createdAt
                    const actorId = sub.userId;

                    sqlContent += `INSERT INTO form_rh_action (id, "companyId", "formId", "submissionId", "actorUserId", "type", "message", "createdAt") VALUES (gen_random_uuid(), '${companyId}', '${formId}', '${sub.id}', '${actorId}', '${type}', 'Ação simulada RH', '${actionDate}');\n`;
                }

                // 2. Form Events (Interaction metrics)
                // Generate events around the submission time (before)
                const sessionStart = new Date(new Date(sub.submittedAt).getTime() - Math.random() * 600000).toISOString(); // -0-10 mins

                if (fields && fields.length > 0) {
                    for (const field of fields) {
                        // Field Focus
                        if (Math.random() < 0.9) {
                            sqlContent += `INSERT INTO form_event (id, "companyId", "formId", "submissionId", "fieldId", "userId", "type", "ts", "meta") VALUES (gen_random_uuid(), '${companyId}', '${formId}', '${sub.id}', '${field.id}', '${sub.userId}', 'field_focus', '${sessionStart}', '{}');\n`;
                        }
                        // Field Change
                        if (Math.random() < 0.8) {
                            sqlContent += `INSERT INTO form_event (id, "companyId", "formId", "submissionId", "fieldId", "userId", "type", "ts", "meta") VALUES (gen_random_uuid(), '${companyId}', '${formId}', '${sub.id}', '${field.id}', '${sub.userId}', 'field_change', '${sessionStart}', '{}');\n`;
                        }
                        // Validation Error (rare)
                        if (Math.random() < 0.1) {
                            sqlContent += `INSERT INTO form_event (id, "companyId", "formId", "submissionId", "fieldId", "userId", "type", "ts", "meta") VALUES (gen_random_uuid(), '${companyId}', '${formId}', '${sub.id}', '${field.id}', '${sub.userId}', 'field_validation_error', '${sessionStart}', '{"error": "invalid"}');\n`;
                        }
                    }
                }
            }
        }
    }

    if (sqlContent) {
        fs.writeFileSync('fix_form_stats.sql', sqlContent);
        console.log('SQL file written. Executing...');
        try {
            execSync(`cat fix_form_stats.sql | docker exec -i iuppy_postgres psql -U iuppy_admin -d iuppy_dev`);
            console.log('✅ SQL executed successfully.');
        } catch (e) {
            console.error('❌ SQL Execution failed:', e.message);
        }
        fs.unlinkSync('fix_form_stats.sql');
    }
}

main();
