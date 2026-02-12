import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { UserEntity } from '../users/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(UserEntity);

    console.log('🔍 Checking for Duplicate Emails...');

    const duplicates = await userRepo.query(`
        SELECT name, COUNT(*) as count
        FROM user_entity
        GROUP BY name
        HAVING COUNT(*) > 1
    `);

    if (duplicates.length === 0) {
        console.log('✅ No duplicates found.');
    } else {
        console.log(`⚠️ Found ${duplicates.length} emails with duplicates.`);

        // Let's inspect the first few duplicates
        for (const dup of duplicates.slice(0, 5)) {
            const users = await userRepo.find({ where: { name: dup.name } });
            console.log(`\nName: ${dup.name}`);
            users.forEach(u => {
                console.log(` - ID: ${u.id} | Email: ${u.email} | Groups: ${u.groups?.length}`);
            });
        }
    }

    const totalUsers = await userRepo.count();
    const uniqueNamesObj = await userRepo.query(`SELECT COUNT(DISTINCT name) as cnt FROM user_entity`);
    const uniqueNames = parseInt(uniqueNamesObj[0].cnt);

    console.log(`\nTotal Users: ${totalUsers}`);
    console.log(`Unique Names: ${uniqueNames}`);
    console.log(`Duplication Factor: ${(totalUsers / uniqueNames).toFixed(2)}x`);

    await app.close();
}

bootstrap();
