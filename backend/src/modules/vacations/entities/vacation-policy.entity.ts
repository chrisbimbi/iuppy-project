import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { VacationPolicy } from '@shared/types';

@Entity('vacation_policies')
export class VacationPolicyEntity implements VacationPolicy {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    companyId!: string;

    @Column()
    name!: string;

    @Column({ type: 'int', default: 30 })
    minDaysAntecedence!: number;

    @Column({ default: true })
    allowFractioning!: boolean;

    @Column({ type: 'int', default: 3 })
    maxPeriods!: number;

    @Column({ type: 'jsonb', default: {} })
    minDaysPerPeriod!: Record<string, any>;

    @Column({ default: true })
    allowCashAllowance!: boolean;

    @Column({ type: 'int', default: 10 })
    sellingLimitDays!: number;

    @Column({ default: 'START_OF_PERIOD' })
    sellingTiming!: string;

    @Column({ default: true })
    allow13thAdvance!: boolean;

    @Column({ default: 'MANAGER' }) // MANAGER, HR, BOTH
    approvalFlow!: string;

    @Column({ type: 'int', default: 5 })
    approvalSlaDays!: number;

    @Column({ default: 'standard' })
    accrualLogic!: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: string;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: string;
}
