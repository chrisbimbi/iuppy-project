
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
    // --- Identificadores ---
    externalId: string; // ID no ERP
    email: string;
    secondaryEmail?: string;
    personalEmail?: string;
    registrationNumber?: string; // Matrícula
    internalId?: string; // ID interno iuppy (se já existir)

    // --- Nome e Pessoal ---
    fullName: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    preferredName?: string;
    birthDate?: Date;
    gender?: string;
    maritalStatus?: string;
    nationality?: string;
    academicLevel?: string;
    raceColor?: string;
    disabilityType?: string;

    // --- Documentos ---
    cpf?: string;
    rg?: string;
    rgIssuer?: string;
    rgState?: string;
    rgIssueDate?: Date;
    pis?: string;
    ctpsNumber?: string;
    ctpsSeries?: string;
    ctpsState?: string;
    voterId?: string;

    // --- Contato e Endereço ---
    phone?: string; // Work phone
    mobile?: string; // Personal/Mobile
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    address?: string; // Full string
    addressStreet?: string;
    addressNumber?: string;
    addressComplement?: string;
    addressNeighborhood?: string;
    addressCity?: string;
    addressState?: string;
    addressZipCode?: string;

    // --- Emprego e Hierarquia ---
    role?: string;
    jobTitle?: string;
    department?: string;
    costCenter?: string;
    managerId?: string; // External ID of the manager
    managerEmail?: string;
    location?: string;
    legalEntity?: string; // CNPJ/Nome da Filial
    employmentType?: string; // CLT, PJ, Estágio
    employmentStatus?: string; // Ativo, Afastado, Desligado
    workShift?: string; // Jornada
    hireDate?: Date;
    terminationDate?: Date;
    probationEndDate?: Date;
    isActive: boolean;

    // --- Remuneração e Financeiro ---
    baseSalary?: number;
    hourlyRate?: number;
    payFrequency?: string;
    currency?: string;
    bankName?: string;
    bankBranch?: string;
    bankAccount?: string;
    bankAccountType?: string;
    pixKey?: string;

    // --- Outros ---
    avatarUrl?: string;
    locale?: string;
    rawPayload?: any; // Objeto original do ERP para auditoria
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
