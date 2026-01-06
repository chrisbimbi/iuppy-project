import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AssessmentForm, AssessmentType, AssessmentStatus } from '@shared/types';
import { UserEntity } from '../../../users/user.entity';
import { PerformanceCycleEntity } from './performance-cycle.entity';

@Entity('assessment_forms')
@Index(['cycleId'])
@Index(['targetUserId'])
@Index(['evaluatorUserId'])
export class AssessmentFormEntity implements AssessmentForm {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    cycleId!: string;

    @Column()
    targetUserId!: string;

    @Column()
    evaluatorUserId!: string;

    @Column({
        type: 'enum',
        enum: AssessmentType,
    })
    type!: AssessmentType;

    @Column({
        type: 'enum',
        enum: AssessmentStatus,
        default: AssessmentStatus.PENDING,
    })
    status!: AssessmentStatus;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: string;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: string;

    @ManyToOne(() => PerformanceCycleEntity)
    @JoinColumn({ name: 'cycleId' })
    cycle?: PerformanceCycleEntity;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'targetUserId' })
    targetUser?: UserEntity;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'evaluatorUserId' })
    evaluatorUser?: UserEntity;
}
