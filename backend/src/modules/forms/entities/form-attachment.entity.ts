import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm'

@Entity('form_attachment')
@Index(['companyId', 'submissionId'])
export class FormAttachmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  companyId: string

  @Column('uuid')
  submissionId: string

  @Column('uuid')
  formId: string

  @Column('text')
  storagePath: string

  @Column('text', { nullable: true })
  mimeType: string | null

  @Column('bigint', { nullable: true })
  bytes: string | null

  @Column('text', { default: 'ok' })
  status: 'ok' | 'failed'

  @Column('text', { nullable: true })
  error: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  uploadedAt: Date
}
