
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { Role } from '@shared/types';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(UserEntity);

    const email = 'ana.costa@demo.com.br';

    console.log(`🔍 Fixing Role for ${email}...`);

    const user = await userRepo.findOne({ where: { email } });

    if (!user) {
        console.error(`❌ User ${email} not found!`);
        await app.close();
        return;
    }

    console.log(`Current Role: ${user.role}`);

    if (user.role !== Role.User) {
        console.log(`⚠️ User is not Role.User. Updating to Role.User...`);
        user.role = Role.User;
        await userRepo.save(user);
        console.log(`✅ Role updated to: ${user.role}`);
    } else {
        console.log(`✅ User is already Role.User.`);
    }

    await app.close();
}

bootstrap();
