// src/forms/entities/form.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// Novo tipo para campos traduzíveis
export type TranslatableString = {
  [locale: string]: string; // ex: { "pt-BR": "Título", "en": "Title" }
};

// ==================================
// CORREÇÃO: Adicionando o tipo que faltava
// ==================================
export type FormStatus = 'draft' | 'published' | 'archived';

@Entity('form')
@Index(['companyId', 'status'])
export class FormEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  companyId: string;

  @Column('uuid')
  @Index()
  createdBy: string;

  @Column('jsonb')
  title: TranslatableString; // DTO deve enviar { "pt-BR": "..." }

  @Column('jsonb', { nullable: true })
  description: TranslatableString | null;

  @Column('text', { default: 'draft' })
  status: FormStatus; // Usando o tipo corrigido

  @Column('timestamptz', { nullable: true })
  scheduleStartAt: Date | null;

  @Column('timestamptz', { nullable: true })
  scheduleEndAt: Date | null;

  @Column('timestamptz', { nullable: true })
  deadlineAt: Date | null;

  @Column('timestamptz', { nullable: true })
  publishedAt: Date | null;

  @Column('boolean', { default: false })
  allowMultipleSubmissions: boolean;

  @Column('boolean', { default: false })
  anonymous: boolean;

  @Column('boolean', { default: false })
  allowExternal: boolean;

  @Column('text', { array: true, nullable: true })
  audienceSpaceIds: string[] | null;

  @Column('text', { array: true, nullable: true })
  audienceGroupIds: string[] | null;

  @Column('jsonb', { nullable: true })
  remindersConfig: any | null;

  @Column('jsonb', { nullable: true })
  notificationsConfig: any | null;

  @Column('boolean', { default: false })
  requiresApproval: boolean;

  @Column('boolean', { default: false })
  attachmentsAllowed: boolean;

  @Column('jsonb', { nullable: true })
  attachmentHelpText: TranslatableString | null;

  @Column('boolean', { default: false })
  allowTranslations: boolean;

  @Column('text', { nullable: true, default: 'pt-BR' })
  defaultLocale: string;

  @Column('jsonb', { nullable: true })
  acl: any | null;

  @Column('int', { default: 1 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}