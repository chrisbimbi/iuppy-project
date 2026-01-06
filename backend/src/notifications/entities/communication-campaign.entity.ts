import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum CampaignStatus {
    DRAFT = 'draft',
    SCHEDULED = 'scheduled',
    SENT = 'sent',
    FAILED = 'failed',
}

export enum CampaignChannel {
    PUSH = 'push',
    EMAIL = 'email',
    FEED = 'feed',
}

@Entity('communication_campaigns')
export class CommunicationCampaignEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    @Index()
    company_id: string;

    @Column('text')
    title: string;

    @Column('text')
    message_body: string;

    @Column('text', { nullable: true })
    image_url: string;

    @Column({
        type: 'enum',
        enum: CampaignStatus,
        default: CampaignStatus.DRAFT,
    })
    status: CampaignStatus;

    @Column({
        type: 'enum',
        enum: CampaignChannel,
        default: CampaignChannel.PUSH,
    })
    channel: CampaignChannel;

    @Column('jsonb', { default: {} })
    audience_config: any; // { departmentId: '...', role: '...' } or { all: true }

    @Column({ type: 'timestamptz', nullable: true })
    scheduled_at: Date;

    @Column({ type: 'timestamptz', nullable: true })
    sent_at: Date;

    // Stats snapshot
    @Column('int', { default: 0 })
    stats_sent: number;

    @Column('int', { default: 0 })
    stats_delivered: number;

    @Column('int', { default: 0 })
    stats_opened: number;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
