
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegrationConnection } from '../entities/integration_connection.entity';
import { IntegrationRun, IntegrationRunStatus, IntegrationRunType } from '../entities/integration_run.entity';
import { ConnectorFactory } from '../connectors/connector.factory';
import { FullSyncService } from './full-sync.service';
import { DeltaSyncService } from './delta-sync.service';

@Injectable()
export class SyncPipelineService {
    private readonly logger = new Logger(SyncPipelineService.name);

    constructor(
        @InjectRepository(IntegrationRun)
        private runRepo: Repository<IntegrationRun>,
        private connectorFactory: ConnectorFactory,
        private fullSyncService: FullSyncService,
        private deltaSyncService: DeltaSyncService,
    ) { }

    async startSync(connection: IntegrationConnection, type: IntegrationRunType, trigger: string): Promise<IntegrationRun> {
        this.logger.log(`Starting ${type} sync for company ${connection.companyId} (Provider: ${connection.providerKey})`);

        // 1. Create Run Log
        const run = this.runRepo.create({
            connection,
            type,
            status: IntegrationRunStatus.RUNNING,
            trigger,
            stats: { processed: 0, added: 0, updated: 0, failed: 0 },
        });
        await this.runRepo.save(run);

        // 2. Async Execution (Fire and forget, handled by BullMQ in real prod, but here we await for simplicity or use setImmediate)
        this.executePipeline(run, connection).catch(err => {
            this.logger.error(`Pipeline failed for run ${run.id}`, err.stack);
            run.status = IntegrationRunStatus.FAILED;
            run.finishedAt = new Date();
            this.runRepo.save(run);
        });

        return run;
    }

    private async executePipeline(run: IntegrationRun, connection: IntegrationConnection) {
        try {
            // 3. Instantiate Connector
            const connector = await this.connectorFactory.createConnector(connection);

            // 4. Test Connection
            const isConnected = await connector.testConnection();
            if (!isConnected) {
                throw new Error('Connection test failed');
            }

            // 5. Delegate to specific Strategy
            if (run.type === IntegrationRunType.FULL) {
                await this.fullSyncService.execute(run, connector);
            } else {
                await this.deltaSyncService.execute(run, connector);
            }

            // 6. Finalize Run
            run.status = IntegrationRunStatus.SUCCESS;
        } catch (e) {
            run.status = IntegrationRunStatus.FAILED;
            this.logger.error(e);
        } finally {
            run.finishedAt = new Date();
            await this.runRepo.save(run);
        }
    }
}
