
import { IntegrationConnection } from '../entities/integration_connection.entity';

export interface ConnectorSyncResult<T> {
    data: T[]; // The normalized data items
    hasMore: boolean;
    nextCursor?: string; // For pagination
    watermark?: any; // For delta sync tracking (e.g. updatedSince)
}

/**
 * Normalized entity structure that all connectors must output.
 * This decouples the core system from the provider's specific schema.
 */
export interface NormalizedUser {
    externalId: string;
    email: string;
    fullName: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    jobTitle?: string;
    department?: string;
    location?: string;
    managerId?: string; // External ID of the manager
    hireDate?: Date;
    terminationDate?: Date;
    // For AI functionality
    salaryBand?: string; // "L1", "L2"... (Obfuscated)
    commuteDistanceKm?: number;
    rawPayload?: any; // Store original for debugging/snapshots
}

export interface ConnectorOptions {
    connection: IntegrationConnection;
    decryptedSecrets: any;
}

export abstract class BaseConnector {
    protected connection: IntegrationConnection;
    protected secrets: any;

    constructor(options: ConnectorOptions) {
        this.connection = options.connection;
        this.secrets = options.decryptedSecrets;
    }

    /**
     * Valida se a conexão está ativa e as credenciais são válidas.
     */
    abstract testConnection(): Promise<boolean>;

    /**
     * Busca usuários (Full Sync or Delta Sync).
     * @param cursor Pagination cursor
     * @param updatedSince If provided, fetches only changed records (Delta)
     */
    abstract syncUsers(cursor?: string, updatedSince?: Date): Promise<ConnectorSyncResult<NormalizedUser>>;

    // Future methods for other entities:
    // abstract syncOrganizationalStructure(...)
    // abstract syncTimeOffBalances(...)
    // abstract syncDocuments(...)
}
