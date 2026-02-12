
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { GroupEntity } from '../groups/group.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(UserEntity);
    const groupRepo = dataSource.getRepository(GroupEntity);

    const targetEmail = 'ana.costa@demo.com.br';
    const requestCompanyId = '2af4557f-9259-4eed-818d-1d0ffe0b8982';

    console.log(`\n🔍 Checking Company IDs for ${targetEmail}...`);

    const user = await userRepo.findOne({ where: { email: targetEmail } });

    if (!user) {
        console.error(`❌ User ${targetEmail} not found!`);
        await app.close();
        return;
    }

    console.log(`\n--- User Info ---`);
    console.log(`Name: ${user.name}`);
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Company ID (User): ${user.companyId}`);

    if (user.companyId !== requestCompanyId) {
        console.error(`\n[MISMATCH] User CompanyId (${user.companyId}) != Request CompanyId (${requestCompanyId})`);
    } else {
        console.log(`\n[MATCH] User CompanyId matches Request CompanyId.`);
    }

    console.log(`\n--- Group Info ---`);
    const groupIds = user.groups || [];
    console.log(`Assigned Group IDs: ${JSON.stringify(groupIds)}`);

    for (const gid of groupIds) {
        const group = await groupRepo.findOne({ where: { id: gid } });
        if (group) {
            console.log(`Group: ${group.name} (${group.id})`);
            console.log(`Group Company ID: ${group.companyId}`);
            if (group.companyId !== user.companyId) {
                console.error(`  ⚠️ [WARNING] Group CompanyId (${group.companyId}) != User CompanyId (${user.companyId})`);
            } else {
                console.log(`  ✅ Group CompanyId matches User CompanyId.`);
            }
        } else {
            console.error(`❌ Group ID ${gid} not found in DB!`);
        }
    }

    // Check if there is a proper 'Todos' group for the request company
    const correctTodos = await groupRepo.findOne({
        where: {
            name: 'Todos',
            companyId: requestCompanyId
        }
    });

    if (correctTodos) {
        console.log(`\n✅ Correct 'Todos' Group for Request Company (${requestCompanyId}): ${correctTodos.id}`);
        if (!groupIds.includes(correctTodos.id)) {
            console.error(`  ❌ User is NOT in the correct 'Todos' group for their company!`);
        } else {
            console.log(`  ✅ User IS in the correct 'Todos' group.`);
        }
    } else {
        console.log(`\n❌ No 'Todos' group found for Request Company (${requestCompanyId}).`);
    }

    await app.close();
}

bootstrap();
