import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('one_on_ones')
export class OneOnOneEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    companyId!: string;

    @Column()
    organizerUserId!: string;

    @Column()
    participantUserId!: string;

    @Column({ type: 'timestamptz' })
    scheduledDate!: Date;

    @Column({ default: 'SCHEDULED' }) // SCHEDULED, COMPLETED, CANCELED
    status!: string;

    @Column({ type: 'jsonb', default: [] })
    talkingPoints!: Array<{ id: string, text: string, checked: boolean, addedBy: string }>;

    @Column({ type: 'jsonb', default: [] })
    actionItems!: Array<{ id: string, text: string, status: string }>;

    @Column({ type: 'text', nullable: true })
    privateNotes?: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;
}
