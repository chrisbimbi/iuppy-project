import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('company_esocial_config')
export class CompanyEsocialConfigEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { unique: true })
    companyId: string;

    // Habilitação
    @Column('boolean', { default: false })
    enabled: boolean;

    // Ambiente
    @Column('varchar', { default: 'homologacao' })
    environment: 'homologacao' | 'producao';

    // Certificado (armazenado como base64 criptografado)
    @Column('text', { nullable: true })
    certificateData: string; // encrypted base64

    @Column('text', { nullable: true })
    certificatePassword: string; // encrypted

    @Column('timestamptz', { nullable: true })
    certificateExpiry: Date;

    // Médico do Trabalho
    @Column('varchar', { nullable: true })
    medicoNome: string;

    @Column('varchar', { nullable: true })
    medicoCpf: string;

    @Column('varchar', { nullable: true })
    medicoCrm: string;

    @Column('char', { length: 2, nullable: true })
    medicoUf: string;

    // Engenheiro de Segurança
    @Column('varchar', { nullable: true })
    engenheiroNome: string;

    @Column('varchar', { nullable: true })
    engenheiroCpf: string;

    @Column('varchar', { nullable: true })
    engenheiroCrea: string;

    @Column('char', { length: 2, nullable: true })
    engenheiroUf: string;

    // Status
    @Column('boolean', { default: false })
    configured: boolean; // true se tudo preenchido

    @Column('boolean', { default: false })
    connectionTested: boolean;

    @Column('timestamptz', { nullable: true })
    lastTestedAt: Date;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}
