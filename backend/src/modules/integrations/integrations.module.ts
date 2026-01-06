import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { IntegrationProvider } from './entities/integration_provider.entity';
import { IntegrationConnection } from './entities/integration_connection.entity';
import { IntegrationRun } from './entities/integration_run.entity';
import { IntegrationError } from './entities/integration_error.entity';
import { IdentityLink } from './entities/identity_link.entity';
import { DataLakeSnapshot } from './entities/data_lake_snapshot.entity';
import { SecretsVaultService } from './security/secrets-vault.service';
import { MtlsAgentFactory } from './security/mtls-agent.factory';

import { ConnectorFactory } from './connectors/connector.factory';
import { SyncPipelineService } from './pipelines/sync-pipeline.service';
import { FullSyncService } from './pipelines/full-sync.service';
import { DeltaSyncService } from './pipelines/delta-sync.service';

import { BullModule } from '@nestjs/bull';
import { IntegrationProcessor } from './queue/integration.processor';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            IntegrationProvider,
            IntegrationConnection,
            IntegrationRun,
            IntegrationError,
            IdentityLink,
            DataLakeSnapshot
        ]),
        BullModule.registerQueue({
            name: 'integrations',
        }),
    ],
    controllers: [IntegrationsController],
    providers: [
        IntegrationsService,
        SecretsVaultService,
        MtlsAgentFactory,
        ConnectorFactory,
        SyncPipelineService,
        FullSyncService,
        DeltaSyncService,
        IntegrationProcessor
    ],
    exports: [
        IntegrationsService,
        SecretsVaultService,
        MtlsAgentFactory,
        ConnectorFactory,
        SyncPipelineService
    ]
})
export class IntegrationsModule { }
