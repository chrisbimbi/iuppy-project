export interface SystemUser {
    externalId: string;
    email: string;
    name: string;
    jobTitle?: string;
    department?: string;
    phone?: string;
    active: boolean;
    // Flexible bag for extra fields from ERP
    raw: Record<string, any>;
}

export interface SchemaField {
    key: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    sampleValue: any;
}

export interface IIntegrationConnector {
    /**
     * Connects to the remote system and validates credentials.
     */
    connect(credentials: any): Promise<boolean>;

    /**
     * Fetches the schema definition or infers it from sample data.
     * Returns a list of available fields from the ERP.
     */
    fetchSchema(): Promise<SchemaField[]>;

    /**
     * Fetches a batch of users for preview or sync.
     * @param limit Number of records to fetch
     * @param offset Pagination offset
     */
    fetchUsers(limit: number, offset: number): Promise<SystemUser[]>;
}
