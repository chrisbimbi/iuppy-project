
import { Process, Processor, OnQueueActive, OnQueueError, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { IntegrationRun, IntegrationRunType } from '../entities/integration_run.entity';
import { SyncPipelineService } from '../pipelines/sync-pipeline.service';
import { IntegrationConnection } from '../entities/integration_connection.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Processor('integrations')
export class IntegrationProcessor {
    private readonly logger = new Logger(IntegrationProcessor.name);

    constructor(
        private syncPipeline: SyncPipelineService,
        @InjectRepository(IntegrationConnection)
        private connectionRepo: Repository<IntegrationConnection>,
    ) { }

    @Process('sync')
    async handleSync(job: Job<{ connectionId: string; type: IntegrationRunType; trigger: string }>) {
        const { connectionId, type, trigger } = job.data;
        this.logger.log(`Processing sync job for connection ${connectionId} (Type: ${type})`);

        const connection = await this.connectionRepo.findOneBy({ id: connectionId });
        if (!connection) {
            this.logger.error(`Connection ${connectionId} not found, aborting job.`);
            return;
        }

        try {
            // Re-using the pipeline logic, but now it's running inside a worker
            await this.syncPipeline.startSync(connection, type, trigger);
        } catch (error) {
            this.logger.error(`Job failed for connection ${connectionId}`, error.stack);
            throw error; // Let Bull handle retries if configured
        }
    }

    @OnQueueActive()
    onActive(job: Job) {
        this.logger.log(`Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(job.data)}...`);
    }

    @OnQueueError()
    onError(error: Error) {
        this.logger.error(`Queue Error: ${error.message}`, error.stack);
    }

    @OnQueueFailed()
    onFailed(job: Job, error: Error) {
        this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
    }
}
