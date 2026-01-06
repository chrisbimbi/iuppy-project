import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { UserEntity } from '../../../users/user.entity';

@Entity('identity_links')
@Index(['providerKey', 'externalId'], { unique: true }) // Unique per provider
@Index(['internalUserId', 'providerKey']) // Fast lookup for user's links
export class IdentityLink {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'internal_user_id' })
    internalUserId: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'internal_user_id' })
    user: UserEntity;

    @Column({ name: 'company_id' })
    companyId: string;

    @Column({ name: 'provider_key' })
    providerKey: string;

    @Column({ name: 'external_id' })
    externalId: string; // The ID in the external system (SAP userId, ADP OID)

    @Column({ default: true })
    active: boolean;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any; // Snapshot of raw data for audit

    @Column({ name: 'last_seen_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    lastSeenAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
