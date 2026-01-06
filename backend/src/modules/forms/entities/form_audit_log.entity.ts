// src/forms/entities/form_audit_log.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type FormAuditAction =
  // Form Actions
  | 'form_created'
  | 'form_updated'
  | 'form_status_changed' // published, archived, etc
  | 'form_deleted'
  | 'form_duplicated'
  | 'form_push_sent'
  // Submission/RH Actions
  | 'submission_approved'
  | 'submission_rejected'
  | 'submission_replied' // Legado S1
  | 'submission_chat_sent' // S3
  | 'submission_chat_closed'
  // Config Actions
  | 'notification_settings_updated'
  | 'acl_updated';

@Entity('form_audit_log')
@Index(['companyId', 'formId'])
@Index(['companyId', 'submissionId'])
@Index(['companyId', 'actorUserId'])
export class FormAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  companyId: string;

  @Column('uuid')
  actorUserId: string; // Quem fez a ação (usuário do CMS)

  @Column('text')
  @Index()
  action: FormAuditAction;

  @Column('uuid', { nullable: true })
  formId: string | null;

  @Column('uuid', { nullable: true })
  submissionId: string | null;

  @Column('jsonb', { nullable: true })
  changes: any | null; // Opcional: { from: "draft", to: "published" }

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  createdAt: Date;
}
