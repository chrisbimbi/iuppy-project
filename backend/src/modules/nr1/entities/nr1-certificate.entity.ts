import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { Nr1TrainingSession } from './nr1-training-session.entity';

@Entity('nr1_training_certificates')
@Unique(['numero'])
export class Nr1Certificate {
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

    @Column({ length: 40 })
    numero: string;

    @Column('text')
    arquivo_url: string;

    @Column('boolean', { default: false })
    assinado_icp: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
