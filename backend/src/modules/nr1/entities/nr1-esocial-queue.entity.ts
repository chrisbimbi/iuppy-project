import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum EsocialEventType {
    S2240 = 'S2240',
    S2245 = 'S2245',
}

export enum EsocialStatus {
    QUEUED = 'queued',
    SENT = 'sent',
    FAILED = 'failed',
}

@Entity('nr1_esocial_queue')
@Index(['company_id', 'status'])
export class Nr1EsocialQueue {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    @Index()
    company_id: string;

    @Column({
        type: 'enum',
        enum: EsocialEventType,
    })
    event_type: EsocialEventType;

    @Column('jsonb')
    payload: any;

    @Column({
        type: 'enum',
        enum: EsocialStatus,
        default: EsocialStatus.QUEUED,
    })
    status: EsocialStatus;

    @Column('int', { default: 0 })
    retries: number;

    @Column('text', { nullable: true })
    last_error: string;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
