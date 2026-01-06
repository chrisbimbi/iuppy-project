import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CompanyEntity } from '../../../companies/company.entity';

export enum ConnectionStatus {
    ACTIVE = 'active',
    PAUSED = 'paused',
    ERROR = 'error',
    SETUP_REQUIRED = 'setup_required',
}

@Entity('integration_connections')
export class IntegrationConnection {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'company_id' })
    companyId: string;

    @ManyToOne(() => CompanyEntity)
    @JoinColumn({ name: 'company_id' })
    company: CompanyEntity;

    @Column({ name: 'provider_key' })
    providerKey: string;

    @Column({
        type: 'enum',
        enum: ConnectionStatus,
        default: ConnectionStatus.SETUP_REQUIRED
    })
    status: ConnectionStatus;

    @Column({ name: 'base_url', nullable: true })
    baseUrl: string;

    // Stored as encrypted string (JSON -> String -> Encrypt)
    @Column({ name: 'secrets_encrypted', type: 'jsonb', nullable: true, select: false })
    secretsEncrypted: any;

    @Column({ type: 'jsonb', nullable: true })
    options: Record<string, any>; // mappings, schedule, etc.

    @Column({ type: 'jsonb', nullable: true })
    watermarks: Record<string, any>; // last_sync state

    @Column({ name: 'last_sync_at', type: 'timestamp', nullable: true })
    lastSyncAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
