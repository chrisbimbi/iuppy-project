import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Registros de envios de push/lembrança por notícia.
 * Usado por AnalyticsV2Service e PushV2Service.
 */
@Entity('push_delivery')
@Index(['companyId', 'newsId'])
@Index(['companyId', 'status'])
@Index(['companyId', 'createdAt'])
export class PushDeliveryEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'text' })
    companyId!: string;

    @Column({ type: 'text' })
    newsId!: string;

    @Column({ type: 'text', nullable: true })
    userId!: string | null;

    /** canal lógico do envio (ex: 'remind', 'notify', 'bulk') */
    @Column({ type: 'text', default: 'remind' })
    channel!: string;

    /** provedor tecnológico (ex: 'fcm', 'apns', 'expo', 'webpush') */
    @Column({ type: 'text', nullable: true })
    provider!: string | null;

    /** token/endpoint (quando aplicável) */
    @Column({ type: 'text', nullable: true })
    token!: string | null;

    /** 'queued' | 'sent' | 'delivered' | 'failed' */
    @Column({ type: 'text', default: 'queued' })
    status!: string;

    @Column({ type: 'timestamptz', nullable: true })
    sentAt!: Date | null;

    @Column({ type: 'timestamptz', nullable: true })
    deliveredAt!: Date | null;

    @Column({ type: 'timestamptz', nullable: true })
    openedAt!: Date | null;

    @Column({ type: 'jsonb', nullable: true })
    meta!: Record<string, any> | null;

    @Column({ type: 'text', nullable: true })
    error!: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;
}