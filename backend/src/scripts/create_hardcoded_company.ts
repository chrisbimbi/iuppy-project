import { AppDataSource } from '../config/data-source';

async function createHardcodedCompany() {
    try {
        await AppDataSource.initialize();

        const targetId = '000c0911-58b3-4c80-84bc-fe015eec1961';
        const qr = AppDataSource.createQueryRunner();

        // 1. Create company if not exists
        await qr.query(`
            INSERT INTO company (id, name, slug, active, "createdAt", "updatedAt")
            VALUES ($1, 'Iuppy Dev Company', 'iuppy-dev', true, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING
        `, [targetId]);
        console.log('✅ Company created/verified');

        // 2. Create space
        const spaceResult = await qr.query(`
            INSERT INTO space (id, "companyId", name, slug, description, "distributionChannels", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, 'Geral', 'geral', 'Espaço principal', ARRAY['app']::text[], NOW(), NOW())
            ON CONFLICT DO NOTHING
            RETURNING id
        `, [targetId]);

        let spaceId;
        if (spaceResult.length > 0) {
            spaceId = spaceResult[0].id;
            console.log('✅ Space created:', spaceId);
        } else {
            const existing = await qr.query(`SELECT id FROM space WHERE "companyId" = $1 LIMIT 1`, [targetId]);
            spaceId = existing[0]?.id;
            console.log('✅ Space already exists:', spaceId);
        }

        // 3. Create channel
        const channelResult = await qr.query(`
            INSERT INTO channels (id, "companyId", "spaceId", name, type, description, "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, 'Comunicados', 'articles', 'Canal de comunicados', NOW(), NOW())
            ON CONFLICT DO NOTHING
            RETURNING id
        `, [targetId, spaceId]);

        let channelId;
        if (channelResult.length > 0) {
            channelId = channelResult[0].id;
            console.log('✅ Channel created:', channelId);
        } else {
            const existing = await qr.query(`SELECT id FROM channels WHERE "companyId" = $1 LIMIT 1`, [targetId]);
            channelId = existing[0]?.id;
            console.log('✅ Channel already exists:', channelId);
        }

        // 4. Update Chris if exists
        await qr.query(`UPDATE user_entity SET "companyId" = $1 WHERE phone = '12345678910'`, [targetId]);
        console.log('✅ Chris updated (if exists)');

        // 5. Seed news
        const newsCount = await qr.query(`SELECT COUNT(*) as count FROM news_entity WHERE "companyId" = $1`, [targetId]);
        if (parseInt(newsCount[0].count) === 0) {
            console.log('Seeding 10 news items...');
            for (let i = 1; i <= 10; i++) {
                await qr.query(`
                    INSERT INTO news_entity 
                    (id, "companyId", "channelId", title, content, status, "publishedAt", "createdAt", "updatedAt", "createdBy")
                    VALUES (gen_random_uuid(), $1, $2, $3, $4, 'published', NOW(), NOW(), NOW(), 'system')
                `, [
                    targetId,
                    channelId,
                    `📢 Comunicado Importante #${i}`,
                    `Este é o comunicado número ${i}. Conteúdo de teste para validação.`
                ]);
            }
            console.log('✅ 10 news items created');
        } else {
            console.log(`✅ Already have ${newsCount[0].count} news items`);
        }

        console.log('\n🎉 DONE! Company 000c0911... is ready with content.');
        await qr.release();

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await AppDataSource.destroy();
    }
}

createHardcodedCompany();
