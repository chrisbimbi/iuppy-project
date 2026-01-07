import axios from 'axios';
import { JwtService } from '@nestjs/jwt';
import { AppDataSource } from '../src/config/data-source';
import { UserXPHistoryEntity } from '../src/modules/gamification/entities/user-xp-history.entity';
import { UserBadgeEntity } from '../src/modules/gamification/entities/user-badge.entity';
import { UserEntity } from '../src/users/user.entity';
import { SurveyEntity } from '../src/modules/surveys/entities/survey.entity';
import { NewsEntity } from '../src/news/news.entity';
import { Channel } from '../src/channels/channel.entity';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const API_URL = 'http://localhost:4000';
const USER_ID = '6bba78b5-3bf9-405a-a1be-c98eef4c4192'; // Developer Test

async function main() {
    console.log("🚀 Starting E2E Gamification Verification...");

    // 1. Database Setup (Reset User State)
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5433';

    await AppDataSource.initialize();

    const userRepo = AppDataSource.getRepository(UserEntity);
    const user = await userRepo.findOneBy({ id: USER_ID });
    if (!user) throw new Error(`Test user ${USER_ID} not found!`);

    console.log(`User found: ${user.name} (${user.companyId})`);

    // Reset Stats
    console.log("🧹 Clearing History, Badges...");
    await AppDataSource.getRepository(UserXPHistoryEntity).delete({ userId: USER_ID });
    await AppDataSource.getRepository(UserBadgeEntity).delete({ userId: USER_ID });
    user.xp = 0;
    await userRepo.save(user);

    // Setup Channel
    const channelRepo = AppDataSource.getRepository(Channel);
    let channel = await channelRepo.findOneBy({ companyId: user.companyId });
    if (!channel) {
        channel = channelRepo.create({
            name: 'Test Channel',
            companyId: user.companyId,
            isPublished: true,
        });
        await channelRepo.save(channel);
    }

    // Setup News (5 items for Badge)
    console.log("📰 Creating 5 Dummy News...");
    const newsRepo = AppDataSource.getRepository(NewsEntity);
    const newsIds: string[] = [];
    for (let i = 0; i < 5; i++) {
        const nId = uuidv4();
        await newsRepo.save({
            id: nId,
            companyId: user.companyId,
            authorId: user.id,
            channelId: channel.id,
            title: `Gamification News ${i}`,
            content: 'Test content',
            isPublished: true,
            createdAt: new Date(),
        });
        newsIds.push(nId);
    }

    // Setup Survey
    console.log("📝 Creating Dummy Survey...");
    const surveyRepo = AppDataSource.getRepository(SurveyEntity);
    const surveyId1 = uuidv4();
    await surveyRepo.save({
        id: surveyId1,
        companyId: user.companyId,
        title: 'Gamification Test Survey',
        authorId: user.id,
        adminIds: [user.id],
        status: 'published',
        visibility: 'public',
        spaceIds: [],
    });

    await AppDataSource.destroy();

    // 2. Auth
    console.log("🔑 Generating Token...");
    const jwt = new JwtService({ secret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret' });
    const token = jwt.sign({
        sub: user.id,
        email: user.email,
        companyId: user.companyId,
        role: user.role, // 'company_admin'
        roles: ['company_admin'],
    });

    const api = axios.create({
        baseURL: API_URL,
        headers: { Authorization: `Bearer ${token}` }
    });

    // 3. Test 1: News Flow (Use News 0)
    console.log("\n🧪 TEST 1: News Read Flow (expect +5 XP)");
    try {
        await api.post(`/v2/news/${newsIds[0]}/open`);
        await sleep(1000); // Wait for async event

        const stats = await api.get('/gamification/stats');
        console.log(`Current XP: ${stats.data.xp}`);
        if (stats.data.xp !== 5) throw new Error(`Expected 5 XP, got ${stats.data.xp}`);
        console.log("✅ News Flow Passed");
    } catch (e: any) {
        console.error("❌ Error:", e.response?.data || e.message);
    }

    // 4. Test 2: Survey Flow
    console.log("\n🧪 TEST 2: Survey Flow (expect +20 XP -> Total 25)");
    try {
        await api.post(`/modules/${user.companyId}/surveys/responses`, {
            surveyId: surveyId1,
            userId: user.id, // Explicitly pass user ID
            answers: []
        });
        await sleep(1000);

        const stats = await api.get('/gamification/stats');
        console.log(`Current XP: ${stats.data.xp}`);
        if (stats.data.xp !== 25) throw new Error(`Expected 25 XP, got ${stats.data.xp}`);
        console.log("✅ Survey Flow Passed");
    } catch (e: any) {
        console.error("❌ Survey Flow Failed:", e.response?.data || e.message);
    }

    // 5. Test 3: Badge Flow
    console.log("\n🧪 TEST 3: Badge Flow (News Enthusiast: 5 Reads)");
    try {
        // We already read index 0. Only need 1,2,3,4.
        for (let i = 1; i < 5; i++) {
            await api.post(`/v2/news/${newsIds[i]}/open`);
            process.stdout.write('.');
        }
        await sleep(2000); // Wait for events
        console.log("");

        const badgesRes = await api.get('/gamification/badges');
        const newsBadge = badgesRes.data.find((b: any) => b.slug.includes('news-enthusiast'));

        if (newsBadge && newsBadge.earned) {
            console.log("✅ Badge Flow Passed: 'Leitor Ávido' earned!");
        } else {
            console.error("❌ Badge Flow Failed: Badge not earned.");
            console.log("Badges found:", badgesRes.data.map((b: any) => `${b.slug}: ${b.earned}`));
        }

        const stats = await api.get('/gamification/stats');
        console.log(`Final XP: ${stats.data.xp} (Expected 45)`);

    } catch (e: any) {
        console.error("❌ Badge Flow Failed:", e.response?.data || e.message);
    }
}


function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

main();
