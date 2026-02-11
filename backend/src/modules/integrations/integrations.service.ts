import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { IntegrationProvider } from './entities/integration_provider.entity';
import { IntegrationConnection } from './entities/integration_connection.entity';
import { IntegrationConfigEntity } from './entities/integration_config.entity';
import { MicrosoftGraphConnector } from './connectors/microsoft-graph.connector';
import { AutoMapperService } from './mapper/auto-mapper.service';
import { SyncPipelineService } from './pipelines/sync-pipeline.service';
import { IntegrationRunType } from './entities/integration_run.entity';

@Injectable()
export class IntegrationsService {

    constructor(
        @InjectRepository(IntegrationProvider)
        private providerRepo: Repository<IntegrationProvider>,
        @InjectRepository(IntegrationConnection)
        private connectionRepo: Repository<IntegrationConnection>,
        @InjectRepository(IntegrationConfigEntity)
        private configRepo: Repository<IntegrationConfigEntity>,
        private autoMapper: AutoMapperService,
        private syncPipeline: SyncPipelineService,
        @InjectQueue('integrations') private integrationsQueue: Queue,
    ) { }

    async discoverSchema(connectionId: string): Promise<any> {
        // Instantiate connector manually for schema discovery (Mock mode doesn't need real connection/secrets)
        const connector = new MicrosoftGraphConnector({ connection: {} as any, decryptedSecrets: {} });

        // --- DEMO MODE BYPASS (Still mock the API call, but allow real DB connection ID) ---
        if (connectionId === 'f207d707-8c30-49b0-a820-d35767ade5af') {
            const schema = await connector.fetchSchema();
            const suggestedMapping = this.autoMapper.suggestMapping(schema);
            return { schema, suggestedMapping };
        }
        // ------------------------

        const connection = await this.connectionRepo.findOneBy({ id: connectionId });
        if (!connection) throw new Error('Connection not found');

        // 1. Fetch Schema (Real or Mock)
        // In a real scenario, we would use a factory based on providerKey.
        // For this phase, we force MicrosoftGraphConnector if provider is azure-ad (or for demo purposes).
        const schema = await connector.fetchSchema();

        // 2. Auto-Map
        const suggestedMapping = this.autoMapper.suggestMapping(schema);

        return {
            schema,
            suggestedMapping
        };
    }

    async saveConfig(connectionId: string, mapping: any, uniqueIdentifier: string): Promise<IntegrationConfigEntity> {
        let config = await this.configRepo.findOneBy({ connectionId });

        if (!config) {
            config = this.configRepo.create({ connectionId });
        }

        config.fieldMapping = mapping;
        // extended logic could save uniqueIdentifier too if we add a column, 
        // or store it in the mapping JSON under a special key like _primaryKey
        config.fieldMapping['_primaryKey'] = uniqueIdentifier;

        return this.configRepo.save(config);
    }

    async getConfig(connectionId: string): Promise<IntegrationConfigEntity | null> {
        return this.configRepo.findOneBy({ connectionId });
    }

    async triggerSync(connectionId: string, type: 'full' | 'delta' = 'full'): Promise<any> {
        const connection = await this.connectionRepo.findOneBy({ id: connectionId });
        if (!connection) throw new Error('Connection not found');

        // Cast string type to enum
        const runType = type === 'full' ? IntegrationRunType.FULL : IntegrationRunType.DELTA;

        // Add job to queue
        const job = await this.integrationsQueue.add('sync', {
            connectionId: connection.id,
            type: runType,
            trigger: 'manual_api'
        });

        return { message: 'Sync job queued', jobId: job.id };
    }


    /**
     * Returns the FORM SCHEMA for the connection settings of a specific provider.
     * This tells the Frontend what fields to render (URL, User, Pass, etc).
     */
    getProviderConfigSchema(providerKey: string) {
        switch (providerKey) {
            case 'totvs-protheus':
                return [
                    { key: 'baseUrl', label: 'Protheus API URL', type: 'text', placeholder: 'https://api.meuprotheus.com.br/', required: true },
                    { key: 'username', label: 'Usuário de Serviço', type: 'text', required: true },
                    { key: 'password', label: 'Senha', type: 'password', required: true },
                    { key: 'branch', label: 'Filial (Opcional)', type: 'text', placeholder: 'D MG 01' }
                ];
            case 'senior-hcm':
                return [
                    { key: 'g7Url', label: 'G7 / Senior X URL', type: 'text', placeholder: 'https://platform.senior.com.br/t/senior.com.br/bridge/1.0/rest/', required: true },
                    { key: 'accessKey', label: 'Access Key', type: 'password', required: true },
                    { key: 'secret', label: 'Secret Key', type: 'password', required: true },
                    { key: 'tenant', label: 'Tenant Name', type: 'text', placeholder: 'empresa01', required: true }
                ];
            case 'adp-workforce':
                return [
                    { key: 'apiUrl', label: 'ADP API Endpoint', type: 'text', default: 'https://api.adp.com', required: true },
                    { key: 'clientId', label: 'Client ID', type: 'text', required: true },
                    { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
                    { key: 'orgId', label: 'Organization OID', type: 'text', required: true },
                    { key: 'certP12', label: 'Certificado Mutual TLS (.p12)', type: 'file', required: true }
                ];
            case 'google-workspace':
                return [
                    { key: 'serviceAccountJson', label: 'Service Account JSON', type: 'textarea', required: true },
                    { key: 'adminEmail', label: 'E-mail do Admin (Impersonation)', type: 'text', required: true }
                ];
            case 'microsoft-entra':
            default:
                // Microsoft Entra ID (Default)
                return [
                    { key: 'tenantId', label: 'Tenant ID', type: 'text', required: true },
                    { key: 'clientId', label: 'Client ID', type: 'text', required: true },
                    { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true }
                ];
        }
    }

    async listProviders() {
        // Mock providers for Phase 6 Demo - bypassing DB lookup since seed/DB was wiped
        const providers = [
            {
                id: 'mock-azure-ad',
                key: 'azure-ad',
                name: 'Microsoft Entra ID',
                description: 'Sync users and groups from Azure Active Directory via Graph API.',
                auth_flow: 'oauth2_cc',
                default_scopes: ['User.Read.All'],
                api_version: 'v1.0',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'mock-google',
                key: 'google-workspace',
                name: 'Google Workspace',
                description: 'Import users from Google Workspace Directory.',
                auth_flow: 'oauth2_cc',
                default_scopes: ['admin.directory.user.readonly'],
                api_version: 'v1',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'mock-totvs-protheus',
                key: 'totvs-protheus',
                name: 'TOTVS Protheus',
                description: 'Sync employees via TOTVS MIle or REST API.',
                auth_flow: 'basic_cert',
                default_scopes: [],
                api_version: 'v12',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'mock-adp',
                key: 'adp-workforce',
                name: 'ADP Workforce Now',
                description: 'Global HR integration via ADP Marketplace API.',
                auth_flow: 'oauth2_cc',
                default_scopes: ['hr.workerProfile.read'],
                api_version: 'v2',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'mock-senior',
                key: 'senior-hcm',
                name: 'Senior HCM (Ronda)',
                description: 'Integration with Senior X Platform / G7.',
                auth_flow: 'api_key',
                default_scopes: [],
                api_version: 'G7',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'mock-lg',
                key: 'lg-pessoa',
                name: 'LG Lugar de Gente',
                description: 'Suíte Gen.te integration via SOAP/REST.',
                auth_flow: 'basic_cert',
                default_scopes: [],
                api_version: 'v1',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'mock-metadados',
                key: 'metadados',
                name: 'Metadados RH',
                description: 'Integration via SIRH Metadados API.',
                auth_flow: 'api_key',
                default_scopes: [],
                api_version: 'v1',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        // Cast to any to bypass strict Entity type check (Entity is missing 'description')
        return providers as any;
    }

    async getCompanyConnections(companyId: string) {
        return this.connectionRepo.find({
            where: { companyId },
            relations: ['company'] // Optional: load company details
        });
    }

    async listConnections(companyId: string) {
        return this.getCompanyConnections(companyId);
    }
}
