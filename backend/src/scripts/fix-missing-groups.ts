import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource, Like } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { GroupEntity } from '../groups/group.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(UserEntity);
    const groupRepo = dataSource.getRepository(GroupEntity);

    console.log('🔧 Fixing Missing Groups...');

    // 1. Get Groups
    const todosGroup = await groupRepo.findOne({ where: { name: 'Todos' } });
    if (!todosGroup) {
        console.error('❌ Group "Todos" not found!');
        await app.close();
        return;
    }

    const gestaoGroup = await groupRepo.findOne({ where: { name: 'Gestão' } });

    // 2. Get Users
    const users = await userRepo.find();
    console.log(`👤 Found ${users.length} users to update.`);

    let updatedCount = 0;

    for (const user of users) {
        // Basic Group Assignment
        const groupsToAssign: GroupEntity[] = [todosGroup];
        const groupIds: string[] = [todosGroup.id];

        // Manager Logic (Simple heuristic)
        if (gestaoGroup && (user.jobTitle?.includes('Manager') || user.jobTitle?.includes('Head') || user.jobTitle?.includes('Diretor'))) {
            groupsToAssign.push(gestaoGroup);
            groupIds.push(gestaoGroup.id);
        }

        user.groups = groupIds;
        user.visibleGroups = groupIds;
        user.memberOf = groupsToAssign;

        await userRepo.save(user);

        updatedCount++;
        if (updatedCount % 100 === 0) console.log(`Processed ${updatedCount}/${users.length}...`);
    }

    console.log('✅ Groups restored successfully.');
    await app.close();
}

bootstrap();
