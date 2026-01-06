import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Nr1RiskRecord } from './nr1-risk-record.entity';

export enum ActionPriority {
    P0 = 'P0',
    P1 = 'P1',
    P2 = 'P2',
    P3 = 'P3',
}

export enum ActionStatus {
    PLANEJADO = 'planejado',
    EM_EXECUCAO = 'em_execucao',
    CONCLUIDO = 'concluido',
    ATRASADO = 'atrasado',
    CANCELADO = 'cancelado',
}

@Entity('nr1_action_plans')
@Index(['risk_id'])
@Index(['status', 'prioridade'])
@Index(['responsavel_id', 'status'])
export class Nr1ActionPlan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    risk_id: string;

    @ManyToOne(() => Nr1RiskRecord, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'risk_id' })
    risk: Nr1RiskRecord;

    @Column('text')
    medida_prevencao: string;

    @Column({
        type: 'enum',
        enum: ActionPriority,
        default: ActionPriority.P2,
    })
    prioridade: ActionPriority;

    @Column('uuid', { nullable: true })
    @Index()
    responsavel_id: string; // Fk to users table (logical)

    @Column('date', { nullable: true })
    inicio_previsto: string;

    @Column('date', { nullable: true })
    fim_previsto: string;

    @Column('text', { nullable: true })
    forma_acompanhamento: string;

    @Column('jsonb', { nullable: true })
    kpi: any;

    @Column({
        type: 'enum',
        enum: ActionStatus,
        default: ActionStatus.PLANEJADO,
    })
    status: ActionStatus;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
