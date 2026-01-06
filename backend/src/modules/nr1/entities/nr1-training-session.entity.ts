import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Nr1Training } from './nr1-training.entity';

@Entity('nr1_training_sessions')
export class Nr1TrainingSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    training_id: string;

    @ManyToOne(() => Nr1Training)
    @JoinColumn({ name: 'training_id' })
    training: Nr1Training;

    @Column('jsonb')
    segmento_audiencia: any; // Who should take this training

    @Column('timestamptz', { nullable: true })
    data_inicio: Date;

    @Column('timestamptz', { nullable: true })
    data_fim: Date;

    @Column({ default: true })
    obrigatorio: boolean;

    @Column('int', { nullable: true })
    periodicidade_months: number;

    @Column({ default: false })
    recorrente: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
