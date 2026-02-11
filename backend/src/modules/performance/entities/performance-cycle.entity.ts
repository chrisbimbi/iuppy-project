import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PerformanceCycle, PerformanceCycleStatus } from '@shared/types';

@Entity('performance_cycles')
export class PerformanceCycleEntity implements PerformanceCycle {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column()
    companyId!: string;

    @Column({ type: 'date' })
    startDate!: string;

    @Column({ type: 'date' })
    endDate!: string;

    @Column({
        type: 'enum',
        enum: PerformanceCycleStatus,
        default: PerformanceCycleStatus.SETUP,
    })
    status!: PerformanceCycleStatus;

    @Column({ type: 'jsonb', default: {} })
    participantsFilter!: Record<string, any>;

    @Column({ nullable: true })
    templateId?: string;

    @Column({ default: false })
    includeCalibration!: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: string;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: string;
}
