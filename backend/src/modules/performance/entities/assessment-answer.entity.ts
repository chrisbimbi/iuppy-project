import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AssessmentAnswer } from '@shared/types';
import { AssessmentFormEntity } from './assessment-form.entity';

@Entity('assessment_answers')
@Index(['formId'])
export class AssessmentAnswerEntity implements AssessmentAnswer {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    formId!: string;

    @Column()
    questionId!: string;

    @Column({ type: 'int', nullable: true })
    score?: number;

    @Column({ type: 'text', nullable: true })
    textAnswer?: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: string;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: string;

    @ManyToOne(() => AssessmentFormEntity)
    @JoinColumn({ name: 'formId' })
    form?: AssessmentFormEntity;
}
