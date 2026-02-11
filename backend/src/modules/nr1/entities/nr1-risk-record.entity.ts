import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Nr1RiskCriteria } from './nr1-risk-criteria.entity';
import { Nr1RiskType } from './nr1-risk-type.entity';

export enum RiskLevel {
    BAIXO = 'b',
    MEDIO = 'm',
    ALTO = 'a',
    MUITO_ALTO = 'ma',
}

export enum RiskStatus {
    ATIVO = 'ativo',
    INATIVO = 'inativo',
}

@Entity('nr1_risk_records')
@Index(['company_id', 'status'])
@Index(['company_id', 'space_id', 'channel_id'])
export class Nr1RiskRecord {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    @Index()
    company_id: string;

    @Column('uuid', { nullable: true })
    @Index()
    space_id: string;

    @Column('uuid', { nullable: true })
    @Index()
    channel_id: string;

    @Column({ length: 160 })
    processo: string;

    @Column({ length: 160 })
    ambiente: string;

    @Column({ length: 160 })
    atividade: string;

    @Column('text')
    perigo: string;

    @Column('text')
    fonte_circunstancia: string;

    @Column('text')
    possiveis_lesoes: string;

    @Column('jsonb')
    grupos_expostos: string[]; // List of exposed groups/roles

    @Column('jsonb')
    medidas_prevencao: any[]; // List of measures { desc, owner, status }

    @Column('text')
    caracterizacao_exposicao: string;

    @Column('int', { default: 0 })
    probabilidade: number;

    @Column('int', { default: 0 })
    severidade: number;

    @Column({
        type: 'enum',
        enum: RiskLevel,
    })
    classificacao_risco: RiskLevel;

    @Column('uuid', { nullable: true })
    criterios_id: string;

    @ManyToOne(() => Nr1RiskCriteria, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'criterios_id' })
    criterios: Nr1RiskCriteria;

    @Column('uuid', { nullable: true })
    risk_type_id: string;

    @ManyToOne(() => Nr1RiskType, { nullable: true })
    @JoinColumn({ name: 'risk_type_id' })
    risk_type: Nr1RiskType;

    @Column({
        type: 'enum',
        enum: RiskStatus,
        default: RiskStatus.ATIVO,
    })
    status: RiskStatus;

    @Column('int', { default: 1 })
    version: number; // Optimistic locking

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
