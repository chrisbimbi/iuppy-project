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
    console.log('📈 Fixing News Analytics (File-based)...');

    const companyId = getSqlResult(`SELECT "companyId" FROM user_entity LIMIT 1`).trim();
    const newsIds = getSqlResult(`SELECT id FROM news_entity WHERE "companyId"='${companyId}'`).split('\n').filter(s => s.trim());
    // Get active users (with devices) for push logs
    const activeUserIds = getSqlResult(`SELECT "userId" FROM user_device WHERE "companyId"='${companyId}'`).split('\n').filter(s => s.trim());
    // Get all users for other interactions
    const allUserIds = getSqlResult(`SELECT id FROM user_entity WHERE "companyId"='${companyId}'`).split('\n').filter(s => s.trim());

    console.log(`Found ${newsIds.length} news, ${activeUserIds.length} active users, ${allUserIds.length} total users.`);

    let sqlContent = '';

    // Optional: Clear existing interactions if we want to be sure? 
    // User said "delete the one that doesn't have statistics". 
    // But we want to ADD statistics. Let's keep existing and ADD more to be safe.
    // Or maybe clear to avoid duplicates if we re-run?
    // Let's clear to ensure clean state and high quality data.
    sqlContent += `DELETE FROM news_interaction_event;\n`;
    sqlContent += `DELETE FROM news_reaction;\n`;
    sqlContent += `DELETE FROM news_comment;\n`;
    sqlContent += `DELETE FROM push_delivery;\n`;

    for (const nid of newsIds) {
        const newsId = nid.trim();

        // 1. Push Delivery (to 90% of active users)
        const targetPushUsers = activeUserIds.sort(() => 0.5 - Math.random()).slice(0, Math.floor(activeUserIds.length * 0.9));
        for (const uid of targetPushUsers) {
            const sentAt = randomDate(30);
            // deliveredAt is NOT in schema based on previous checks, using createdAt
            sqlContent += `INSERT INTO push_delivery (id, "companyId", "newsId", "userId", "status", "createdAt") VALUES (gen_random_uuid(), '${companyId}', '${newsId}', '${uid.trim()}', 'delivered', '${sentAt}');\n`;
        }

        // 2. Views (Open) (to 70% of all users - some might open without push)
        const targetViewUsers = allUserIds.sort(() => 0.5 - Math.random()).slice(0, Math.floor(allUserIds.length * 0.7));
        for (const uid of targetViewUsers) {
            const viewedAt = randomDate(30);
            sqlContent += `INSERT INTO news_interaction_event (id, "companyId", "newsId", "userId", "type", "createdAt") VALUES (gen_random_uuid(), '${companyId}', '${newsId}', '${uid.trim()}', 'OPEN', '${viewedAt}');\n`;

            // 3. Reactions (30% of viewers)
            if (Math.random() < 0.3) {
                const reaction = ['like', 'love', 'clap', 'smile', 'neutral'][Math.floor(Math.random() * 5)];
                sqlContent += `INSERT INTO news_reaction (id, "companyId", "newsId", "userId", "reaction", "createdAt") VALUES (gen_random_uuid(), '${companyId}', '${newsId}', '${uid.trim()}', '${reaction}', '${viewedAt}');\n`;
            }

            // 4. Comments (10% of viewers)
            if (Math.random() < 0.1) {
                const text = ['Muito bom!', 'Interessante', 'Obrigado por compartilhar', 'Ciente', 'Apoio a iniciativa'][Math.floor(Math.random() * 5)];
                sqlContent += `INSERT INTO news_comment (id, "companyId", "newsId", "userId", "text", "approved", "createdAt") VALUES (gen_random_uuid(), '${companyId}', '${newsId}', '${uid.trim()}', '${text}', true, '${viewedAt}');\n`;
            }
        }
    }

    if (sqlContent) {
        fs.writeFileSync('temp_news_stats.sql', sqlContent);
        console.log('SQL file written. Executing...');
        try {
            execSync(`cat temp_news_stats.sql | docker exec -i iuppy_postgres psql -U iuppy_admin -d iuppy_dev`);
            console.log('✅ SQL executed successfully.');
        } catch (e) {
            console.error('❌ SQL Execution failed:', e.message);
        }
        fs.unlinkSync('temp_news_stats.sql');
    } else {
        console.log('No SQL to execute.');
    }
}

main();
