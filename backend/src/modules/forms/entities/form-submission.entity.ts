import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { FormEntity } from './form.entity'

export type FormSubmissionStatus = 'pending' | 'replied' | 'approved' | 'rejected'

@Entity('form_submission')
@Index(['companyId', 'formId'])
export class FormSubmissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  @Index()
  companyId: string

  @Column('uuid')
  @Index()
  formId: string

  @ManyToOne(() => FormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formId' })
  form?: FormEntity

  @Column('timestamptz')
  submittedAt: Date

  @Column('uuid', { nullable: true })
  userId: string | null

  @Column('boolean', { default: false })
  external: boolean

  @Column('text', { nullable: true })
  externalEmail: string | null

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  spaceIds: string[]

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  groupIds: string[]

  @Column('boolean', { nullable: true })
  isOnTime: boolean | null

  @Column('text', { default: 'pending' })
  status: FormSubmissionStatus

  @Column('int', { default: 0 })
  replyCount: number

  @Column('int', { default: 0 })
  fileCount: number

  @Column('jsonb', { nullable: true })
  meta: any | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date
}
