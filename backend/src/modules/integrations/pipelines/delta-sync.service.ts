
import { Injectable, Logger } from '@nestjs/common';
import { IntegrationRun } from '../entities/integration_run.entity';
import { BaseConnector } from '../connectors/base.connector';

@Injectable()
export class DeltaSyncService {
    private readonly logger = new Logger(DeltaSyncService.name);

    async execute(run: IntegrationRun, connector: BaseConnector) {
        this.logger.log(`Executing Delta Sync for Run ${run.id}`);
        // Logic similar to Full Sync but using 'updatedSince'

        // Mock implementation
        const result = await connector.syncUsers(undefined, new Date(Date.now() - 86400000));

        run.stats = {
            processed: result.data.length,
            added: 0,
            updated: 0,
            failed: 0
        };
    }
}
