import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

export type FormEventType =
  | 'form_impression'
  | 'form_open'
  | 'form_start'
  | 'form_save_draft'
  | 'field_focus'
  | 'field_change'
  | 'field_validation_error'
  | 'attachment_upload_start'
  | 'attachment_upload_success'
  | 'attachment_upload_fail'
  | 'form_submit_attempt'
  | 'form_submit_success'
  | 'form_submit_fail'
  | 'form_view_submission';

@Entity('form_event')
@Index(['companyId', 'formId'])
@Index(['companyId', 'ts'])
export class FormEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  companyId: string;

  @Column('uuid')
  formId: string;

  @Column('text')
  type: FormEventType;

  @Column('uuid', { nullable: true })
  userId: string | null;

  @Column('boolean', { default: false })
  external: boolean;

  @Column('text', { nullable: true })
  externalEmail: string | null;

  @Column('uuid', { nullable: true })
  fieldId: string | null;

  @Column('jsonb', { nullable: true })
  meta: any | null;

  @CreateDateColumn({ type: 'timestamptz' })
  ts: Date;
}
