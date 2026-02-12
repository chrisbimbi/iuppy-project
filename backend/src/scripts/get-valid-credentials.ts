import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { UserEntity } from '../users/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(UserEntity);

    console.log('🔍 Fetching Valid Users...');

    const users = await userRepo.find({
        where: { isActive: true },
        take: 10,
        order: { name: 'ASC' }
    });

    console.log('\n--- Valid Credentials ---');
    for (const u of users) {
        // Try to find CPF in column or customAttributes
        const cpf = u.cpf || u.customAttributes?.cpf || 'N/A';
        const role = u.jobTitle || 'Employee';
        console.log(`Name: ${u.name}`);
        console.log(`Email: ${u.email}`);
        console.log(`CPF: ${cpf}`);
        console.log(`Role: ${role}`);
        console.log('---');
    }

    await app.close();
}

bootstrap();
