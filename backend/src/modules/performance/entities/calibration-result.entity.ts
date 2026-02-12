import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { UserEntity } from '../../../users/user.entity';
import { PerformanceCycleEntity } from './performance-cycle.entity';

@Entity('calibration_results')
@Index(['cycleId'])
@Index(['userId'])
export class CalibrationResultEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    cycleId: string;

    @Column()
    userId: string;

    @Column({ type: 'numeric', precision: 5, scale: 2 })
    scoreX: number; // Potential/Competencies

    @Column({ type: 'numeric', precision: 5, scale: 2 })
    scoreY: number; // Results/Performance

    @Column()
    quadrant: string;

    @Column({ type: 'text', nullable: true })
    justification: string;

    @Column({ type: 'timestamp', nullable: true })
    calibratedAt: Date;

    @Column({ nullable: true })
    calibratorId: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;

    @ManyToOne(() => PerformanceCycleEntity)
    @JoinColumn({ name: 'cycleId' })
    cycle: PerformanceCycleEntity;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'userId' })
    user: UserEntity;
}
