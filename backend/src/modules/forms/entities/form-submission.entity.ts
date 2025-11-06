// backend/src/modules/forms/entities/form-submission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

export type FormSubmissionStatus = 'pending'|'replied'|'approved'|'rejected'

@Entity('form_submission')
@Index(['companyId','formId','submittedAt'])
@Index(['status'])
export class FormSubmissionEntity {
  @PrimaryGeneratedColumn('uuid') id!: string

  @Column() @Index() companyId!: string
  @Column() @Index() formId!: string

  @Column({ type: 'timestamptz', nullable: true }) submittedAt!: Date | null
  @Column({ nullable: true }) userId!: string | null
  @Column({ type: 'boolean', default: false }) external!: boolean
  @Column({ type: 'text', nullable: true }) externalEmail!: string | null

  @Column('text', { array: true, nullable: true, default: () => 'ARRAY[]::text[]' })
  spaceIds!: string[]

  @Column('text', { array: true, nullable: true, default: () => 'ARRAY[]::text[]' })
  groupIds!: string[]

  @Column({ type: 'boolean', nullable: true }) isOnTime!: boolean | null

  @Column({ type: 'enum', enum: ['pending','replied','approved','rejected'], default: 'pending' })
  status!: FormSubmissionStatus

  @Column({ type: 'int', default: 0 }) replyCount!: number
  @Column({ type: 'int', default: 0 }) fileCount!: number
  @Column({ type: 'jsonb', nullable: true }) meta!: Record<string, any> | null

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date
}
