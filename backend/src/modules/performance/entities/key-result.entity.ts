import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { KeyResult } from '@shared/types';
import { GoalEntity } from './goal.entity';

@Entity('key_results')
@Index(['goalId'])
export class KeyResultEntity implements KeyResult {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    goalId!: string;

    @Column({ type: 'float' })
    targetValue!: number;

    @Column({ type: 'float', default: 0 })
    currentValue!: number;

    @Column()
    metricUnit!: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: string;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: string;

    @ManyToOne(() => GoalEntity)
    @JoinColumn({ name: 'goalId' })
    goal?: GoalEntity;
}
