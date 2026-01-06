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
    console.log('🔧 Fixing Duplicates & Populating Daily Metrics...');

    const companyId = getSqlResult(`SELECT "companyId" FROM user_entity LIMIT 1`).trim();

    let sqlContent = '';

    // 1. Deduplicate Channels
    console.log('   - Deduplicating Channels...');
    // Keep the one with the most recent createdAt? Or just any.
    // We'll use a CTE to keep one per name.
    sqlContent += `
        DELETE FROM channel 
        WHERE id IN (
            SELECT id FROM (
                SELECT id, ROW_NUMBER() OVER (partition BY name ORDER BY "createdAt" DESC) as rnum 
                FROM channel WHERE "companyId"='${companyId}'
            ) t WHERE t.rnum > 1
        );
    `;

    // 2. Deduplicate News
    console.log('   - Deduplicating News...');
    sqlContent += `
        DELETE FROM news_entity 
        WHERE id IN (
            SELECT id FROM (
                SELECT id, ROW_NUMBER() OVER (partition BY title ORDER BY "createdAt" DESC) as rnum 
                FROM news_entity WHERE "companyId"='${companyId}'
            ) t WHERE t.rnum > 1
        );
    `;

    // 3. Populate news_metrics_daily
    console.log('   - Populating news_metrics_daily...');
    // Clear first?
    sqlContent += `DELETE FROM news_metrics_daily;\n`;

    // We need to aggregate from:
    // - news_interaction_event (opens, unique opens)
    // - news_reaction (reactions)
    // - news_comment (comments)
    // - push_delivery (acks? No, push delivery is usually separate, but maybe acks are tracked there? 
    //   The service code showed 'acks' coming from 'news_metrics_daily'. 
    //   Let's assume 'acks' = 'OPEN' events for now or just 0 if we don't have explicit acks.
    //   Actually, 'ack' usually means 'acknowledgement' feature. We didn't populate that.

    // We will do this via a massive INSERT INTO ... SELECT query for efficiency.

    // Opens & Unique Opens
    // Group by newsId, date(createdAt)

    sqlContent += `
    INSERT INTO news_metrics_daily (id, "companyId", "newsId", "date", "opens", "uniqueOpens", "reactions", "comments", "shares", "acks", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        '${companyId}',
        n.id,
        d.date,
        COALESCE(opens_count, 0),
        COALESCE(unique_opens_count, 0),
        COALESCE(reactions_count, 0),
        COALESCE(comments_count, 0),
        0, -- shares
        0, -- acks
        NOW(),
        NOW()
    FROM news_entity n
    CROSS JOIN (
        SELECT DISTINCT DATE("createdAt") as date FROM news_interaction_event
        UNION SELECT DISTINCT DATE("createdAt") as date FROM news_reaction
        UNION SELECT DISTINCT DATE("createdAt") as date FROM news_comment
    ) d
    LEFT JOIN (
        SELECT "newsId", DATE("createdAt") as date, COUNT(*) as opens_count, COUNT(DISTINCT "userId") as unique_opens_count
        FROM news_interaction_event
        WHERE type IN ('OPEN', 'VIEW')
        GROUP BY "newsId", DATE("createdAt")
    ) o ON n.id = o."newsId" AND d.date = o.date
    LEFT JOIN (
        SELECT "newsId", DATE("createdAt") as date, COUNT(*) as reactions_count
        FROM news_reaction
        GROUP BY "newsId", DATE("createdAt")
    ) r ON n.id = r."newsId" AND d.date = r.date
    LEFT JOIN (
        SELECT "newsId", DATE("createdAt") as date, COUNT(*) as comments_count
        FROM news_comment
        GROUP BY "newsId", DATE("createdAt")
    ) c ON n.id = c."newsId" AND d.date = c.date
    WHERE (COALESCE(opens_count, 0) + COALESCE(reactions_count, 0) + COALESCE(comments_count, 0)) > 0;
    `;

    if (sqlContent) {
        fs.writeFileSync('fix_duplicates_and_metrics.sql', sqlContent);
        console.log('SQL file written. Executing...');
        try {
            execSync(`cat fix_duplicates_and_metrics.sql | docker exec -i iuppy_postgres psql -U iuppy_admin -d iuppy_dev`);
            console.log('✅ SQL executed successfully.');
        } catch (e) {
            console.error('❌ SQL Execution failed:', e.message);
        }
        fs.unlinkSync('fix_duplicates_and_metrics.sql');
    }
}

main();
