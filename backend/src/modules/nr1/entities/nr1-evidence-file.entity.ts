import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum EvidenceType {
    INVENTARIO = 'inventario',
    PLANO = 'plano',
    TREINAMENTO = 'treinamento',
    CERTIFICADO = 'certificado',
    SIMULADO = 'simulado',
    OUTROS = 'outros',
}

@Entity('nr1_evidence_files')
export class Nr1EvidenceFile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    @Index()
    company_id: string;

    @Column({
        type: 'enum',
        enum: EvidenceType,
    })
    tipo: EvidenceType;

    @Column('text')
    file_url: string;

    @Column('text')
    @Index({ unique: true })
    sha256: string;

    @Column({ default: false })
    assinado_icp: boolean;

    @Column('text', { nullable: true })
    manifesto: string; // url or text

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
