// src/modules/forms/entities/form-submission.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// 🔥 NOVO STATUS 'submitted' adicionado para form que não requer aprovação
export type FormSubmissionStatus =
  | 'pending'
  | 'submitted'
  | 'replied'
  | 'approved'
  | 'rejected';
export type FormChatStatus = 'open' | 'closed';

@Entity('form_submission')
@Index(['companyId', 'formId', 'submittedAt'])
export class FormSubmissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  companyId: string;

  @Column('uuid')
  formId: string;

  @Column('int', { default: 1 })
  formVersion: number;

  @Column('timestamptz')
  @Index()
  submittedAt: Date;

  @Column('uuid', { nullable: true })
  @Index()
  userId: string | null;

  @Column('boolean', { default: false })
  external: boolean;

  @Column('text', { nullable: true })
  externalEmail: string | null;

  @Column('text', { array: true, nullable: true })
  spaceIds: string[] | null;

  @Column('text', { array: true, nullable: true })
  groupIds: string[] | null;

  @Column('boolean', { nullable: true })
  isOnTime: boolean | null;

  @Column('text', { default: 'pending' })
  @Index()
  status: FormSubmissionStatus;

  @Column('text', { default: 'open' })
  @Index()
  chatStatus: FormChatStatus;

  @Column('int', { default: 0 })
  replyCount: number;

  @Column('int', { default: 0 })
  fileCount: number;

  @Column('int', { default: 0 })
  userUnreadChatCount: number;

  @Column('jsonb', { nullable: true })
  meta: any | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
