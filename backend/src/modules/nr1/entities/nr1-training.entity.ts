import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum TrainingType {
    INICIAL = 'inicial',
    PERIODICO = 'periodico',
    EVENTUAL = 'eventual',
}

export enum TrainingModality {
    PRESENCIAL = 'presencial',
    EAD = 'EAD',
    SEMIPRESENCIAL = 'semipresencial',
}

@Entity('nr1_trainings')
export class Nr1Training {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    @Index()
    company_id: string;

    @Column('text')
    titulo: string;

    @Column({
        type: 'enum',
        enum: TrainingType,
    })
    tipo: TrainingType;

    @Column({
        type: 'enum',
        enum: TrainingModality,
    })
    modalidade: TrainingModality;

    @Column('decimal', { precision: 5, scale: 1 })
    carga_horaria: number;

    @Column('text', { nullable: true })
    projeto_pedagogico_url: string;

    @Column('jsonb')
    conteudos: any[]; // List of lessons, videos

    @Column('jsonb', { nullable: true })
    requisitos_anexo_ii: any;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
