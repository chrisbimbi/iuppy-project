import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Goal, GoalType } from '@shared/types';
import { UserEntity } from '../../../users/user.entity';

@Entity('goals')
@Index(['userId'])
export class GoalEntity implements Goal {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    userId!: string;

    @Column({ type: 'uuid', nullable: true })
    parentGoalId?: string;

    @Column()
    title!: string;

    @Column({ type: 'int', default: 0 })
    weight!: number;

    @Column({ type: 'int', default: 0 })
    progress!: number;

    @Column({
        type: 'enum',
        enum: GoalType,
        default: GoalType.INDIVIDUAL,
    })
    type!: GoalType;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: string;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'userId' })
    user?: UserEntity;

    @ManyToOne(() => GoalEntity)
    @JoinColumn({ name: 'parentGoalId' })
    parentGoal?: GoalEntity;
}
