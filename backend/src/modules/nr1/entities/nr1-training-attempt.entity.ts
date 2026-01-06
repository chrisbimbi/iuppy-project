import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { Nr1TrainingSession } from './nr1-training-session.entity';

@Entity('nr1_training_attempts')
@Unique(['session_id', 'user_id'])
export class Nr1TrainingAttempt {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    session_id: string;

    @ManyToOne(() => Nr1TrainingSession)
    @JoinColumn({ name: 'session_id' })
    session: Nr1TrainingSession;

    @Column('uuid')
    @Index()
    user_id: string;

    @Column('int', { default: 0 })
    tempo_total_seg: number;

    @Column('numeric', { precision: 5, scale: 2, default: 0 })
    progresso: number;

    @Column('numeric', { precision: 5, scale: 2, nullable: true })
    nota_final: number;

    @Column('jsonb', { nullable: true })
    quiz_log: any;

    @Column({ type: 'timestamptz', nullable: true })
    ultimo_evento_at: Date;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
