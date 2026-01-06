import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Nr1EsocialQueue } from './nr1-esocial-queue.entity';

@Entity('nr1_esocial_results')
export class Nr1EsocialResult {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    queue_id: string;

    @ManyToOne(() => Nr1EsocialQueue)
    @JoinColumn({ name: 'queue_id' })
    queue_item: Nr1EsocialQueue;

    @Column('text', { nullable: true })
    receipt: string;

    @Column('int')
    status_code: number;

    @Column('text')
    status_msg: string;

    @Column('jsonb', { nullable: true })
    raw_response: any;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
