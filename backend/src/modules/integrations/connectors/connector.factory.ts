import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IntegrationConnection } from '../entities/integration_connection.entity';
import { SecretsVaultService } from '../security/secrets-vault.service';
import { MtlsAgentFactory } from '../security/mtls-agent.factory';
import { BaseConnector, ConnectorOptions } from './base.connector';
// Will import specific connectors here as they are created
import { AdpConnector } from './implementations/adp.connector';
import { MicrosoftGraphConnector } from './microsoft-graph.connector';

@Injectable()
export class ConnectorFactory {
    constructor(
        private secretsVault: SecretsVaultService,
        private mtlsFactory: MtlsAgentFactory
    ) { }

    async createConnector(connection: IntegrationConnection): Promise<BaseConnector> {
        let decryptedSecrets = {};
        if (connection.secretsEncrypted) {
            decryptedSecrets = await this.secretsVault.decrypt(connection.secretsEncrypted);
        }

        const options: ConnectorOptions & { mtlsFactory: MtlsAgentFactory } = {
            connection,
            decryptedSecrets,
            mtlsFactory: this.mtlsFactory,
        };

        switch (connection.providerKey) {
            case 'adp':
                return new AdpConnector(options);
            case 'microsoft':
            case 'microsoft-graph':
            case 'azure-ad':
                return new MicrosoftGraphConnector(options);
            // case 'sap-sf': ...
            // case 'totvs-protheus': ...
            default:
                throw new InternalServerErrorException(`Provider ${connection.providerKey} not supported`);
        }
    }
}
