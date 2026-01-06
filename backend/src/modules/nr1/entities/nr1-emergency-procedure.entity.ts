import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('nr1_emergency_procedures')
@Index(['company_id', 'titulo', 'versao'], { unique: true })
export class Nr1EmergencyProcedure {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    @Index()
    company_id: string;

    @Column('text')
    titulo: string;

    @Column('text')
    conteudo: string; // Markdown/HTML

    @Column({ length: 40 })
    versao: string;

    @Column({ default: false })
    assinado_icp: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
