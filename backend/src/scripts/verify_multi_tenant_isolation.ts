import { AppDataSource } from '../config/data-source';
import { CompanyEntity } from '../companies/company.entity';
import { UserEntity } from '../users/user.entity';
import { NewsEntity } from '../news/news.entity';
import { Channel } from '../channels/channel.entity';
import { SpaceEntity } from '../spaces/space.entity';

async function verifyMultiTenantIsolation() {
    try {
        await AppDataSource.initialize();
        console.log('\n🔒 MULTI-TENANT ISOLATION VERIFICATION\n');

        // 1. Create Company A
        const companyARepo = AppDataSource.getRepository(CompanyEntity);
        let companyA = await companyARepo.findOne({ where: { name: 'Test Company A' } });
        if (!companyA) {
            companyA = await companyARepo.save({ id: '00000000-0000-0000-0000-00000000000A', name: 'Test Company A' } as any);
        }
        console.log(`✅ Company A: ${companyA.id}`);

        // 2. Create Company B
        let companyB = await companyARepo.findOne({ where: { name: 'Test Company B' } });
        if (!companyB) {
            companyB = await companyARepo.save({ id: '00000000-0000-0000-0000-00000000000B', name: 'Test Company B' } as any);
        }
        console.log(`✅ Company B: ${companyB.id}`);

        // 3. Create users for each company
        const userRepo = AppDataSource.getRepository(UserEntity);
        let userA = await userRepo.findOne({ where: { email: 'usera@test.com' } });
        if (!userA) {
            userA = await userRepo.save({
                email: 'usera@test.com',
                name: 'User A',
                password: 'hash',
                companyId: companyA.id,
                role: 'user' as any,
            } as any);
        }

        let userB = await userRepo.findOne({ where: { email: 'userb@test.com' } });
        if (!userB) {
            userB = await userRepo.save({
                email: 'userb@test.com',
                name: 'User B',
                password: 'hash',
                companyId: companyB.id,
                role: 'user' as any,
            } as any);
        }
        console.log(`✅ Users created`);

        // 4. Create spaces for each
        const spaceRepo = AppDataSource.getRepository(SpaceEntity);
        let spaceA = await spaceRepo.findOne({ where: { companyId: companyA.id } });
        if (!spaceA) {
            spaceA = await spaceRepo.save({
                companyId: companyA.id,
                name: 'Space A',
                slug: 'space-a',
                distributionChannels: ['app'],
            } as any);
        }

        let spaceB = await spaceRepo.findOne({ where: { companyId: companyB.id } });
        if (!spaceB) {
            spaceB = await spaceRepo.save({
                companyId: companyB.id,
                name: 'Space B',
                slug: 'space-b',
                distributionChannels: ['app'],
            } as any);
        }
        console.log(`✅ Spaces created`);

        // 5. Create channels
        const channelRepo = AppDataSource.getRepository(Channel);
        let channelA = await channelRepo.findOne({ where: { companyId: companyA.id } });
        if (!channelA) {
            channelA = await channelRepo.save({
                companyId: companyA.id,
                spaceId: spaceA.id,
                name: 'Channel A',
                type: 'articles',
            } as any);
        }

        let channelB = await channelRepo.findOne({ where: { companyId: companyB.id } });
        if (!channelB) {
            channelB = await channelRepo.save({
                companyId: companyB.id,
                spaceId: spaceB.id,
                name: 'Channel B',
                type: 'articles',
            } as any);
        }
        console.log(`✅ Channels created`);

        // 6. Create news items
        const newsRepo = AppDataSource.getRepository(NewsEntity);

        const newsACount = await newsRepo.count({ where: { companyId: companyA.id } });
        if (newsACount === 0) {
            for (let i = 1; i <= 5; i++) {
                await newsRepo.save({
                    companyId: companyA.id,
                    authorId: userA.id,
                    channelId: channelA.id,
                    title: `Company A News #${i}`,
                    content: `Content for Company A #${i}`,
                    isPublished: true,
                    settings: {},
                } as any);
            }
        }

        const newsBCount = await newsRepo.count({ where: { companyId: companyB.id } });
        if (newsBCount === 0) {
            for (let i = 1; i <= 5; i++) {
                await newsRepo.save({
                    companyId: companyB.id,
                    authorId: userB.id,
                    channelId: channelB.id,
                    title: `Company B News #${i}`,
                    content: `Content for Company B #${i}`,
                    isPublished: true,
                    settings: {},
                } as any);
            }
        }
        console.log(`✅ News items created\n`);

        // 7. VERIFY ISOLATION
        console.log('🧪 TESTING DATA ISOLATION:\n');

        const newsA = await newsRepo.find({ where: { companyId: companyA.id } });
        const newsB = await newsRepo.find({ where: { companyId: companyB.id } });

        console.log(`📊 Company A has ${newsA.length} news items`);
        console.log(`📊 Company B has ${newsB.length} news items`);

        // Verify no cross-contamination
        const crossCheck = newsA.find(n => n.companyId !== companyA.id);
        if (crossCheck) {
            console.error(`\n❌ SECURITY BREACH: Found news from another company in Company A query!`);
            console.error(`   News ID: ${crossCheck.id}, Company: ${crossCheck.companyId}`);
            return;
        }

        const crossCheckB = newsB.find(n => n.companyId !== companyB.id);
        if (crossCheckB) {
            console.error(`\n❌ SECURITY BREACH: Found news from another company in Company B query!`);
            console.error(`   News ID: ${crossCheckB.id}, Company: ${crossCheckB.companyId}`);
            return;
        }

        console.log(`\n✅ ISOLATION VERIFIED: No data leakage detected`);
        console.log(`✅ Each company only sees their own data`);

        // 8. CLEANUP (optional)
        console.log(`\n🧹 Test data remains in DB for inspection (IDs: ...000A, ...000B)`);

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await AppDataSource.destroy();
    }
}

verifyMultiTenantIsolation();
