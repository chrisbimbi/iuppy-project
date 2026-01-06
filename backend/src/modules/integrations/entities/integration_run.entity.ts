
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IntegrationConnection } from './integration_connection.entity';

export enum IntegrationRunType {
    FULL = 'full',
    DELTA = 'delta',
}

export enum IntegrationRunStatus {
    RUNNING = 'running',
    SUCCESS = 'success',
    FAILED = 'failed',
    PARTIAL = 'partial',
}

@Entity('integration_runs')
export class IntegrationRun {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => IntegrationConnection)
    @JoinColumn({ name: 'connection_id' })
    connection: IntegrationConnection;

    @Column({
        type: 'enum',
        enum: IntegrationRunType
    })
    type: IntegrationRunType;

    @Column({ name: 'started_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    startedAt: Date;

    @Column({ name: 'finished_at', type: 'timestamp', nullable: true })
    finishedAt: Date;

    @Column({
        type: 'enum',
        enum: IntegrationRunStatus,
        default: IntegrationRunStatus.RUNNING
    })
    status: IntegrationRunStatus;

    @Column({ nullable: true })
    trigger: string; // manual, schedule

    @Column({ type: 'jsonb', nullable: true })
    stats: {
        processed: number;
        added: number;
        updated: number;
        failed: number;
    };
}
