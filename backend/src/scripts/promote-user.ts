import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { Role } from '@shared/types';
import * as argon2 from 'argon2';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(UserEntity);

    console.log('👑 Promoting User to Super Admin...');
    const email = 'julia.silva@demo.com.br';

    let user = await userRepo.findOne({ where: { email } });

    if (!user) {
        console.log(`⚠️ User ${email} not found. Creating new Super Admin...`);
        user = userRepo.create({
            email,
            name: 'Júlia Silva (Super Admin)',
            password: await argon2.hash('123456'),
            role: Role.SuperAdmin, // Assuming 'super_admin' maps to this Enum key
            companyId: '00000000-0000-0000-0000-000000000000', // Default or find one
            isActive: true
        });

        // Find a valid company ID if possible, otherwise use a placeholder
        const anyUser = await userRepo.findOne({ where: { isActive: true } });
        if (anyUser) {
            user.companyId = anyUser.companyId;
        }

    } else {
        console.log(`✅ User found: ${user.name}`);
        user.role = Role.SuperAdmin;
    }

    await userRepo.save(user);
    console.log(`🎉 ${email} is now a SUPER ADMIN.`);

    await app.close();
}

bootstrap();
