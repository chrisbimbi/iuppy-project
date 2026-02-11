
import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { IntegrationConnection, ConnectionStatus } from '../modules/integrations/entities/integration_connection.entity';
import { CompanyEntity } from '../companies/company.entity';
import { IntegrationProvider } from '../modules/integrations/entities/integration_provider.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    const companyRepo = dataSource.getRepository(CompanyEntity);
    const connectionRepo = dataSource.getRepository(IntegrationConnection);
    const providerRepo = dataSource.getRepository(IntegrationProvider);

    console.log('Finding company...');
    const company = await companyRepo.findOne({ where: {} });
    if (!company) {
        console.error('No company found. Please seed companies first.');
        process.exit(1);
    }

    console.log('Finding or creating provider...');
    let provider = await providerRepo.findOneBy({ key: 'azure-ad' });
    if (!provider) {
        provider = providerRepo.create({
            key: 'azure-ad',
            name: 'Microsoft Entra ID',
            auth_flow: 'oauth2_cc' as any
        });
        await providerRepo.save(provider);
    }

    console.log('Creating demo connection...');
    // Check if exists
    let connection = await connectionRepo.findOneBy({ providerKey: 'azure-ad', companyId: company.id });

    if (!connection) {
        connection = connectionRepo.create({
            companyId: company.id,
            providerKey: 'azure-ad',
            status: ConnectionStatus.SETUP_REQUIRED,
            baseUrl: 'https://graph.microsoft.com/v1.0'
        });
        await connectionRepo.save(connection);
        console.log(`Created connection with ID: ${connection.id}`);
    } else {
        console.log(`Connection already exists with ID: ${connection.id}`);
    }

    // Output the ID so I can copy it to the frontend code
    console.log('--- COPY THIS ID ---');
    console.log(connection.id);
    console.log('--------------------');

    await app.close();
}

bootstrap();
