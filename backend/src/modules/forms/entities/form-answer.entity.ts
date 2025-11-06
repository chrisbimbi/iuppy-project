// backend/src/modules/forms/entities/form-answer.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

@Entity('form_answer')
@Index(['companyId','submissionId','formId','fieldId'])
export class FormAnswerEntity {
  @PrimaryGeneratedColumn('uuid') id!: string

  @Column() @Index() companyId!: string
  @Column() @Index() submissionId!: string
  @Column() @Index() formId!: string
  @Column() @Index() fieldId!: string

  @Column('text') type!: string
  @Column({ type: 'jsonb', nullable: true }) value!: any

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date
}
