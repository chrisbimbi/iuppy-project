import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { VacationRequest, VacationRequestStatus, VacationType } from '@shared/types';
import { UserEntity } from '../../../users/user.entity';
import { CollectiveVacationEntity } from './collective-vacation.entity';

@Entity('vacation_requests')
@Index(['userId'])
@Index(['status'])
export class VacationRequestEntity implements VacationRequest {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    userId!: string;

    @Column({ type: 'date' })
    startDate!: string;

    @Column({ type: 'date' })
    endDate!: string;

    @Column({ type: 'int', default: 0 })
    soldDays!: number;

    @Column({ default: false })
    request13th!: boolean;

    @Column({
        type: 'enum',
        enum: VacationType,
        default: VacationType.INDIVIDUAL,
    })
    type!: VacationType;

    @Column({
        type: 'enum',
        enum: VacationRequestStatus,
        default: VacationRequestStatus.PENDING,
    })
    status!: VacationRequestStatus;

    @Column({ type: 'jsonb', nullable: true })
    approvalFlowSnapshot?: Record<string, any>;

    @Column({ type: 'text', nullable: true })
    rejectionReason?: string;

    @Column({ type: 'text', nullable: true })
    attachmentUrl?: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: string;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'userId' })
    user?: UserEntity;

    @Column({ nullable: true })
    collectiveVacationId?: string;

    @ManyToOne(() => CollectiveVacationEntity, (cv) => cv.requests)
    @JoinColumn({ name: 'collectiveVacationId' })
    collectiveVacation?: CollectiveVacationEntity;
}
