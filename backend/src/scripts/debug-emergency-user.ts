import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource, Like } from 'typeorm';
import { UserEntity } from '../users/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(UserEntity);

    console.log('🔍 Inspecting User Data...');

    const activeUser = await userRepo.findOne({
        where: { email: Like('%@empresa.com.br'), isActive: true },
    });

    if (!activeUser) {
        console.error('❌ No ACTIVE mock user found!');
    } else {
        console.log('✅ Active User Found:', activeUser.email);
        console.log('Active User Groups:', activeUser.groups);
        console.log('Active User VisibleGroups:', activeUser.visibleGroups);
    }

    const totalUsers = await userRepo.count();
    const usersWithGroups = await userRepo.createQueryBuilder('u')
        .where('array_length(u.groups, 1) > 0')
        .getCount();

    console.log(`Total Users: ${totalUsers}`);
    console.log(`Users with Groups: ${usersWithGroups}`);

    await app.close();
}

bootstrap();
