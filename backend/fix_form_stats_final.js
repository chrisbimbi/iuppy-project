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

async function main() {
    console.log('📉 Fixing Deep Form Stats (Events, Actions & Daily Metrics)...');

    const companyId = getSqlResult(`SELECT "companyId" FROM user_entity LIMIT 1`).trim();
    const formIds = getSqlResult(`SELECT id FROM form WHERE "companyId"='${companyId}'`).split('\n').filter(s => s.trim());

    let sqlContent = '';

    // Clear existing
    sqlContent += `DELETE FROM form_event;\n`;
    sqlContent += `DELETE FROM form_rh_action;\n`;
    sqlContent += `DELETE FROM form_metrics_daily;\n`;

    for (const fid of formIds) {
        const formId = fid.trim();
        const fieldsJson = getSqlResult(`SELECT json_agg(json_build_object('id', id)) FROM form_field WHERE "formId"='${formId}'`);
        let fields = [];
        try { fields = JSON.parse(fieldsJson); } catch (e) { }

        const submissionsJson = getSqlResult(`SELECT json_agg(json_build_object('id', id, 'userId', "userId", 'submittedAt', "submittedAt")) FROM form_submission WHERE "formId"='${formId}'`);
        let submissions = [];
        try { submissions = JSON.parse(submissionsJson); } catch (e) { }

        if (submissions && submissions.length > 0) {
            for (const sub of submissions) {
                // 1. RH Actions
                if (Math.random() < 0.8) {
                    const actionDate = new Date(new Date(sub.submittedAt).getTime() + Math.random() * 86400000).toISOString();
                    const type = Math.random() > 0.5 ? 'approve' : 'reject'; // Lowercase based on logs? "approve" or "reject"
                    // Logs showed: WHERE a.type='approve'
                    const actorId = sub.userId;

                    sqlContent += `INSERT INTO form_rh_action (id, "companyId", "formId", "submissionId", "actorUserId", "type", "message", "createdAt") VALUES (gen_random_uuid(), '${companyId}', '${formId}', '${sub.id}', '${actorId}', '${type}', 'Ação simulada RH', '${actionDate}');\n`;
                }

                // 2. Form Events
                const sessionStart = new Date(new Date(sub.submittedAt).getTime() - Math.random() * 600000).toISOString();

                if (fields && fields.length > 0) {
                    for (const field of fields) {
                        // Field Focus
                        if (Math.random() < 0.9) {
                            // REMOVED submissionId
                            sqlContent += `INSERT INTO form_event (id, "companyId", "formId", "fieldId", "userId", "type", "ts", "meta") VALUES (gen_random_uuid(), '${companyId}', '${formId}', '${field.id}', '${sub.userId}', 'field_focus', '${sessionStart}', '{}');\n`;
                        }
                        // Field Change
                        if (Math.random() < 0.8) {
                            // REMOVED submissionId
                            sqlContent += `INSERT INTO form_event (id, "companyId", "formId", "fieldId", "userId", "type", "ts", "meta") VALUES (gen_random_uuid(), '${companyId}', '${formId}', '${field.id}', '${sub.userId}', 'field_change', '${sessionStart}', '{}');\n`;
                        }
                    }
                }
            }
        }
    }

    // 3. Populate form_metrics_daily
    // Aggregating from form_submission and form_event
    // We need to group by formId, date

    // We will use a smart INSERT SELECT
    sqlContent += `
    INSERT INTO form_metrics_daily ("companyId", "formId", "date", "submits", "onTimeSubmits", "opens", "starts", "impressions", "eligibles", "pushSent")
    SELECT
        '${companyId}',
        f.id,
        d.date,
        COALESCE(sub.cnt, 0),
        COALESCE(sub.ontime, 0),
        COALESCE(ev.opens, 0),
        COALESCE(ev.starts, 0),
        COALESCE(ev.impressions, 0),
        100, -- eligibles (mock)
        0 -- pushSent
    FROM form f
    CROSS JOIN (
        SELECT DISTINCT DATE("submittedAt") as date FROM form_submission
        UNION SELECT DISTINCT DATE("ts") as date FROM form_event
    ) d
    LEFT JOIN (
        SELECT "formId", DATE("submittedAt") as date, COUNT(*) as cnt, COUNT(*) FILTER (WHERE "isOnTime" IS TRUE) as ontime
        FROM form_submission
        GROUP BY "formId", DATE("submittedAt")
    ) sub ON sub."formId" = f.id AND sub.date = d.date
    LEFT JOIN (
        SELECT "formId", DATE("ts") as date, 
            COUNT(*) FILTER (WHERE type='field_focus') as opens, -- approximating opens/starts
            COUNT(*) FILTER (WHERE type='field_change') as starts,
            COUNT(*) as impressions
        FROM form_event
        GROUP BY "formId", DATE("ts")
    ) ev ON ev."formId" = f.id AND ev.date = d.date
    WHERE f."companyId"='${companyId}' AND (COALESCE(sub.cnt, 0) + COALESCE(ev.impressions, 0)) > 0;
    `;

    if (sqlContent) {
        fs.writeFileSync('fix_form_stats_final.sql', sqlContent);
        console.log('SQL file written. Executing...');
        try {
            execSync(`cat fix_form_stats_final.sql | docker exec -i iuppy_postgres psql -U iuppy_admin -d iuppy_dev`);
            console.log('✅ SQL executed successfully.');
        } catch (e) {
            console.error('❌ SQL Execution failed:', e.message);
        }
        fs.unlinkSync('fix_form_stats_final.sql');
    }
}

main();
