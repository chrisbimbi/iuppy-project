import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IntegrationRun } from './integration_run.entity';

@Entity('integration_errors')
export class IntegrationError {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'run_id' })
    runId: string;

    @ManyToOne(() => IntegrationRun)
    @JoinColumn({ name: 'run_id' })
    run: IntegrationRun;

    @Column({ name: 'entity_ref', nullable: true })
    entityRef: string; // email, cpf, eternal_id

    @Column({ name: 'error_code', nullable: true })
    errorCode: string;

    @Column({ type: 'text', nullable: true })
    message: string;

    @Column({ name: 'payload_dump', type: 'jsonb', nullable: true })
    payloadDump: any;

    @Column({ name: 'stack_trace', type: 'text', nullable: true })
    stackTrace: string;

    @Column({ name: 'retry_count', default: 0 })
    retryCount: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
