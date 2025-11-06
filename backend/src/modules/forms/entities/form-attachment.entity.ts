// backend/src/modules/forms/entities/form-attachment.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'

export type AttachmentStatus = 'ok'|'failed'

@Entity('form_attachment')
@Index(['companyId','submissionId','formId'])
export class FormAttachmentEntity {
  @PrimaryGeneratedColumn('uuid') id!: string

  @Column() @Index() companyId!: string
  @Column() @Index() submissionId!: string
  @Column() @Index() formId!: string

  @Column('text') storagePath!: string
  @Column('text') mimeType!: string
  @Column({ type: 'bigint' }) bytes!: string

  @Column({ type: 'timestamptz' }) uploadedAt!: Date

  @Column({ type: 'enum', enum: ['ok','failed'], default: 'ok' })
  status!: AttachmentStatus

  @Column({ type: 'text', nullable: true }) error!: string | null
}
