import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { IntegrationProvider } from './entities/integration_provider.entity';
import { IntegrationConnection } from './entities/integration_connection.entity';
import { SyncPipelineService } from './pipelines/sync-pipeline.service';
import { IntegrationRunType } from './entities/integration_run.entity';

@Injectable()
export class IntegrationsService {

    constructor(
        @InjectRepository(IntegrationProvider)
        private providerRepo: Repository<IntegrationProvider>,
        @InjectRepository(IntegrationConnection)
        private connectionRepo: Repository<IntegrationConnection>,
        private syncPipeline: SyncPipelineService,
        @InjectQueue('integrations') private integrationsQueue: Queue,
    ) { }

    async triggerSync(connectionId: string, type: 'full' | 'delta' = 'delta'): Promise<any> {
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

    async listProviders() {
        return this.providerRepo.find();
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
