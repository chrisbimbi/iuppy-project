
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import 'reflect-metadata';

dotenv.config({ path: '.env.development' });

console.log('Connecting to DB:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    db: process.env.DB_NAME
});

const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [],
    synchronize: false,
});

async function run() {
    try {
        await ds.initialize();
        console.log('DB Connected!');

        // Check Heatmap Data Conflict
        console.log('\n--- Heatmap Data Verification ---');

        // Get a company with metrics
        const companyRes = await ds.query(`SELECT news_entity."companyId" FROM news_metrics_daily JOIN news_entity ON news_entity.id = news_metrics_daily."newsId" LIMIT 1`);
        if (companyRes.length > 0) {
            const cid = companyRes[0].companyId;
            console.log(`Checking Metrics for Company: ${cid}`);

            const views = await ds.query(`
            SELECT 
                 EXTRACT(DOW FROM d."date")::int AS day,
                 12 AS hour, 
                 SUM(d.opens)::int as count
               FROM news_metrics_daily d
               JOIN news_entity n ON n.id = d."newsId"
               WHERE n."companyId"='${cid}'
               GROUP BY 1
               ORDER BY 1 ASC
        `);
            console.log('Views (Opens):');
            console.table(views);

            const engagement = await ds.query(`
               SELECT 
                 EXTRACT(DOW FROM d."date")::int AS day,
                 12 AS hour, 
                 SUM(d.reactions + d.comments + d.shares + d.favorites)::int as count
               FROM news_metrics_daily d
               JOIN news_entity n ON n.id = d."newsId"
               WHERE n."companyId"='${cid}'
               GROUP BY 1
               ORDER BY 1 ASC
        `);
            console.log('Engagement (Interactions):');
            console.table(engagement);
        } else {
            console.log('No metrics found to test.');
        }

        process.exit(0);
    } catch (e) {
        console.error('Diagnostic error:', e);
        process.exit(1);
    }
}

run();
