import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('nr1_risk_criteria')
@Index(['company_id', 'version'], { unique: true })
export class Nr1RiskCriteria {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    @Index()
    company_id: string;

    @Column('jsonb')
    modelo: any; // Stores severity x probability matrix, decision rules

    @Column({ length: 40 })
    version: string;

    @Column({ default: false })
    assinado_icp: boolean;

    @Column('text', { nullable: true })
    assinatura_manifesto: string;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
