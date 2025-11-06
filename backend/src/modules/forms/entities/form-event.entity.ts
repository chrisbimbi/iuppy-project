// backend/src/modules/forms/entities/form-event.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'

export type FormEventType =
  | 'form_impression'|'form_open'|'form_start'|'form_save_draft'
  | 'field_focus'|'field_change'|'field_validation_error'
  | 'attachment_upload_start'|'attachment_upload_success'|'attachment_upload_fail'
  | 'form_submit_attempt'|'form_submit_success'|'form_submit_fail'
  | 'form_view_submission'

@Entity('form_event')
@Index(['companyId','formId','ts'])
export class FormEventEntity {
  @PrimaryGeneratedColumn('increment') id!: number

  @Column() @Index() companyId!: string
  @Column() @Index() formId!: string
  @Column({ type: 'text' }) type!: FormEventType

  @Column({ nullable: true }) userId!: string | null
  @Column({ type: 'boolean', default: false }) external!: boolean
  @Column({ type: 'text', nullable: true }) externalEmail!: string | null
  @Column({ nullable: true }) fieldId!: string | null

  @Column({ type: 'jsonb', nullable: true }) meta!: Record<string, any> | null

  @Column({ type: 'timestamptz' }) ts!: Date
}
