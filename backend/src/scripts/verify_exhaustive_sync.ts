
import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    console.log('🔍 Auditing Exhaustive Sync...');

    const totalUsers = await dataSource.query('SELECT count(*) FROM user_entity');
    console.log(`📊 Total Users in DB: ${totalUsers[0].count}`);

    const sampleUsers = await dataSource.query(`
        SELECT 
            email, name, "isActive", "registrationNumber", 
            cpf, rg, "birthDate", "hireDate", "terminationDate",
            "contractType", "workShift", "managerEmail", "payrollData", "addressCity",
            "admissionDate", "salary", "hiringType"
        FROM user_entity 
        WHERE email LIKE '%@empresa.com.br'
        LIMIT 5
    `);

    console.log('🧪 Sample Users (Exhaustive Schema):');
    console.table(sampleUsers);

    const terminatedCount = await dataSource.query('SELECT count(*) FROM user_entity WHERE "isActive" = false');
    console.log(`🚫 Terminated (Soft-Deleted) Users: ${terminatedCount[0].count}`);

    const addressCheck = await dataSource.query('SELECT count(*) FROM user_entity WHERE "addressCity" IS NOT NULL');
    console.log(`📍 Users with Address Data: ${addressCheck[0].count}`);

    const bankCheck = await dataSource.query('SELECT count(*) FROM user_entity WHERE "payrollData"->>\'bankName\' IS NOT NULL');
    console.log(`🏦 Users with Bank Data: ${bankCheck[0].count}`);

    const admissionCheck = await dataSource.query('SELECT count(*) FROM user_entity WHERE "admissionDate" IS NOT NULL');
    console.log(`📅 Users with Admission Date: ${admissionCheck[0].count}`);

    const salaryCheck = await dataSource.query('SELECT count(*) FROM user_entity WHERE "salary" IS NOT NULL');
    console.log(`💰 Users with Salary Data: ${salaryCheck[0].count}`);

    const hiringCheck = await dataSource.query('SELECT count(*) FROM user_entity WHERE "hiringType" IS NOT NULL');
    console.log(`📝 Users with Hiring Type: ${hiringCheck[0].count}`);

    await app.close();
}

bootstrap();
