
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { FullSyncService } from '../modules/integrations/pipelines/full-sync.service';
import { IntegrationsService } from '../modules/integrations/integrations.service';
import { ConnectorFactory } from '../modules/integrations/connectors/connector.factory';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IntegrationRun } from '../modules/integrations/entities/integration_run.entity';
import { IntegrationConnection } from '../modules/integrations/entities/integration_connection.entity';
import { IntegrationConfigEntity } from '../modules/integrations/entities/integration_config.entity';
import { BaseConnector } from '../modules/integrations/connectors/base.connector';
import { Repository } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const fullSyncService = app.get(FullSyncService);
    const integrationsService = app.get(IntegrationsService);

    const runRepo = app.get<Repository<IntegrationRun>>(getRepositoryToken(IntegrationRun));
    const connRepo = app.get<Repository<IntegrationConnection>>(getRepositoryToken(IntegrationConnection));
    const configRepo = app.get<Repository<IntegrationConfigEntity>>(getRepositoryToken(IntegrationConfigEntity));

    console.log('🚀 Starting Force Sync Direct...');

    // 1. Find the Demo Microsoft Connection
    const connection = await connRepo.findOne({ where: { providerKey: 'azure-ad' } });
    if (!connection) {
        console.error('❌ Demo connection not found');
        return;
    }

    // 2. Ensure fieldMapping is exhaustive
    // We want the system to use "A PORRA TODA" mapping
    let config = await configRepo.findOneBy({ connectionId: connection.id });
    if (!config) {
        config = configRepo.create({ connectionId: connection.id, fieldMapping: {} });
    }

    // @ts-ignore - Bypassing strict type check for fieldMapping keys
    config.fieldMapping = {
        name: 'displayName',
        email: 'userPrincipalName',
        firstName: 'givenName',
        lastName: 'surname',
        middleName: 'middleName',
        preferredName: 'preferredName',
        birthDate: 'birthDate',
        gender: 'gender',
        maritalStatus: 'maritalStatus',
        nationality: 'nationality',
        academicLevel: 'academicLevel',
        raceColor: 'raceColor',
        disabilityType: 'disabilityType',
        cpf: 'cpf',
        rg: 'rg',
        rgIssuer: 'rgIssuer',
        rgState: 'rgState',
        rgIssueDate: 'rgIssueDate',
        pis: 'pis',
        ctpsNumber: 'ctpsNumber',
        ctpsSeries: 'ctpsSeries',
        ctpsState: 'ctpsState',
        voterId: 'voterId',
        secondaryEmail: 'secondaryEmail',
        personalEmail: 'personalEmail',
        phone: 'businessPhones',
        mobile: 'mobilePhone',
        emergencyContactName: 'emergencyContact.name',
        emergencyContactPhone: 'emergencyContact.phone',
        address: 'streetAddress',
        addressStreet: 'streetAddress',
        addressNumber: 'streetAddressNumber',
        addressCity: 'city',
        addressState: 'state',
        addressZipCode: 'postalCode',
        registrationNumber: 'employeeId',
        jobTitle: 'jobTitle',
        department: 'department',
        costCenter: 'onPremisesExtensionAttributes.extensionAttribute1',
        legalEntity: 'companyName',
        contractType: 'contractType',
        workShift: 'workShift',
        managerEmail: 'managerEmail',
        hireDate: 'hireDate',
        terminationDate: 'terminationDate',
        probationEndDate: 'probationEndDate',
        baseSalary: 'baseSalary',
        hourlyRate: 'hourlyRate',
        payFrequency: 'payFrequency',
        currency: 'payCurrency',
        bankName: 'bank.name',
        bankBranch: 'bank.agency',
        bankAccount: 'bank.account',
        pixKey: 'bank.pix'
    };
    await configRepo.save(config);
    console.log('✅ Exhaustive Field Mapping saved.');

    // 3. Create a Run
    // @ts-ignore
    const run = runRepo.create({
        connection,
        type: 'full',
        status: 'running',
        startedAt: new Date(),
    });
    await runRepo.save(run);

    // 4. Get Connector
    const connectorFactory = app.get(ConnectorFactory);
    const connector = await connectorFactory.createConnector(connection);

    // 5. Execute Sync
    try {
        await fullSyncService.execute(run, connector as BaseConnector);
        run.status = 'success' as any;
        run.finishedAt = new Date();
        await runRepo.save(run);
        console.log('✨ Sync Completed Successfully:', run.stats);
    } catch (err) {
        console.error('❌ Sync Failed:', err);
        run.status = 'failed';
        run.finishedAt = new Date();
        await runRepo.save(run);
    }

    await app.close();
}

bootstrap();
