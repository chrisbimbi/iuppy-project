import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { VacationBalance } from '@shared/types';
import { UserEntity } from '../../../users/user.entity';

@Entity('vacation_balances')
@Index(['userId'])
export class VacationBalanceEntity implements VacationBalance {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    userId!: string;

    @Column({ type: 'date' })
    periodStart!: string;

    @Column({ type: 'date' })
    periodEnd!: string;

    @Column({ type: 'date' })
    concessiveLimitDate!: string;

    @Column({ type: 'int', default: 0 })
    daysVested!: number;

    @Column({ type: 'int', default: 0 })
    daysTaken!: number;

    @Column({ type: 'int', default: 0 })
    daysSold!: number;

    @Column({ type: 'int', default: 0 })
    balanceTotal!: number;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: string;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'userId' })
    user?: UserEntity;
}
