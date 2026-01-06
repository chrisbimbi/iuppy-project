import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { PDIAction, PDIStatus } from '@shared/types';
import { PDIEntity } from './pdi.entity';

@Entity('pdi_actions')
@Index(['pdiId'])
export class PDIActionEntity implements PDIAction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    pdiId!: string;

    @Column()
    description!: string;

    @Column({ type: 'timestamptz' })
    dueDate!: string;

    @Column({
        type: 'enum',
        enum: PDIStatus,
        default: PDIStatus.NOT_STARTED,
    })
    status!: PDIStatus;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: string;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: string;

    @ManyToOne(() => PDIEntity)
    @JoinColumn({ name: 'pdiId' })
    pdi?: PDIEntity;
}
