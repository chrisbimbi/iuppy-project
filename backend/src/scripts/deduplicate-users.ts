import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource, Like } from 'typeorm';
import { UserEntity } from '../users/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(UserEntity);

    console.log('🧹 Deduplicating Users by Name...');

    // 1. Get all mock users
    const users = await userRepo.find({
        where: { email: Like('%@empresa.com.br') }
    });

    console.log(`Loaded ${users.length} mock users.`);

    // 2. Group by Name
    const groups: Record<string, UserEntity[]> = {};
    for (const u of users) {
        if (!groups[u.name]) groups[u.name] = [];
        groups[u.name].push(u);
    }

    let keptCount = 0;
    let deletedCount = 0;

    const idsToDelete: string[] = [];

    // 3. Select Keepers and Deletions
    for (const name of Object.keys(groups)) {
        const list = groups[name];

        // Sort: Prefer shortest email (carlos.ferreira@... vs carlos.ferreira.123@...)
        // If length same, prefer oldest creation? Or random.
        list.sort((a, b) => {
            if (a.email.length !== b.email.length) {
                return a.email.length - b.email.length;
            }
            return a.email.localeCompare(b.email);
        });

        const keeper = list[0];
        const toDelete = list.slice(1);

        keptCount++;

        for (const d of toDelete) {
            idsToDelete.push(d.id);
        }
    }

    console.log(`Analysis Complete:`);
    console.log(` - Keeping: ${keptCount} unique users`);
    console.log(` - Deleting: ${idsToDelete.length} duplicate users`);

    if (idsToDelete.length > 0) {
        console.log('🔥 Deleting duplicates...');
        // Delete in chunks to avoid query limits
        const chunkSize = 200;
        for (let i = 0; i < idsToDelete.length; i += chunkSize) {
            const chunk = idsToDelete.slice(i, i + chunkSize);
            const placeholders = chunk.map((_, idx) => `$${idx + 1}`).join(',');

            console.log(`   Processing chunk ${Math.ceil((i + 1) / chunkSize)}...`);

            // 1. Delete Related Data
            // Performance
            await dataSource.query(`DELETE FROM assessment_answers WHERE "formId" IN (SELECT id FROM assessment_forms WHERE "targetUserId" IN (${placeholders}) OR "evaluatorUserId" IN (${placeholders}))`, chunk);
            await dataSource.query(`DELETE FROM assessment_forms WHERE "targetUserId" IN (${placeholders}) OR "evaluatorUserId" IN (${placeholders})`, chunk);
            await dataSource.query(`DELETE FROM pdi_actions WHERE "pdiId" IN (SELECT id FROM pdis WHERE "userId" IN (${placeholders}))`, chunk);
            await dataSource.query(`DELETE FROM pdis WHERE "userId" IN (${placeholders})`, chunk);
            await dataSource.query(`DELETE FROM goals WHERE "userId" IN (${placeholders})`, chunk);
            await dataSource.query(`DELETE FROM one_on_ones WHERE "organizerUserId" IN (${placeholders}) OR "participantUserId" IN (${placeholders})`, chunk);
            await dataSource.query(`DELETE FROM calibration_results WHERE "userId" IN (${placeholders})`, chunk);

            // Vacations
            await dataSource.query(`DELETE FROM vacation_requests WHERE "userId" IN (${placeholders})`, chunk);
            await dataSource.query(`DELETE FROM vacation_balances WHERE "userId" IN (${placeholders})`, chunk);

            // Journeys
            await dataSource.query(`DELETE FROM step_completions WHERE "instanceId" IN (SELECT id FROM user_journey_instances WHERE "userId" IN (${placeholders}))`, chunk);
            await dataSource.query(`DELETE FROM user_journey_instances WHERE "userId" IN (${placeholders})`, chunk);

            // Groups & Spaces & XP
            await dataSource.query(`DELETE FROM user_group_members WHERE "user_id" IN (${placeholders})`, chunk);
            await dataSource.query(`DELETE FROM user_space_entity WHERE "userId" IN (${placeholders})`, chunk);
            await dataSource.query(`DELETE FROM user_xp_history WHERE "userId" IN (${placeholders})`, chunk);
            await dataSource.query(`DELETE FROM identity_links WHERE "internal_user_id" IN (${placeholders})`, chunk);

            // Finally: Users
            await userRepo.delete(chunk);
            console.log(`   Deleted ${Math.min(i + chunkSize, idsToDelete.length)} users.`);
        }
        console.log('✅ Deletion complete.');
    } else {
        console.log('✅ No duplicates to delete.');
    }

    await app.close();
}

bootstrap();
