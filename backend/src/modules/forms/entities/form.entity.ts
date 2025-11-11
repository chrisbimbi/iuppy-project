import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

export type FormStatus = 'draft' | 'published' | 'expired' | 'archived'

@Entity('form')
@Index(['companyId', 'status'])
export class FormEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  @Index()
  companyId: string

  @Column('text')
  title: string

  @Column('text', { nullable: true })
  description: string | null

  @Column('text', { default: 'draft' })
  status: FormStatus

  @Column('timestamptz', { nullable: true })
  scheduleStartAt: Date | null

  @Column('timestamptz', { nullable: true })
  scheduleEndAt: Date | null

  @Column('timestamptz', { nullable: true })
  deadlineAt: Date | null

  @Column('boolean', { default: false })
  allowMultipleSubmissions: boolean

  @Column('boolean', { default: false })
  anonymous: boolean

  @Column('boolean', { default: false })
  allowExternal: boolean

  // snapshot de segmentação
  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  audienceSpaceIds: string[]

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  audienceGroupIds: string[]

  @Column('boolean', { default: false })
  attachmentsAllowed: boolean

  @Column('text', { nullable: true })
  attachmentHelpText: string | null

  @Column('jsonb', { nullable: true })
  remindersConfig: any | null

  @Column('jsonb', { nullable: true })
  notificationsConfig: any | null

  @Column('jsonb', { nullable: true })
  acl: any | null

  // se o RH precisa aprovar/reprovar
  @Column('boolean', { default: false })
  requiresApproval: boolean

  // i18n (deixa aqui, mesmo que não use 100% ainda)
  @Column('boolean', { default: false })
  allowTranslations: boolean

  @Column('text', { nullable: true })
  defaultLocale: string | null

  @Column('uuid', { nullable: true })
  createdBy: string | null

  @Column('timestamptz', { nullable: true })
  publishedAt: Date | null

  @Column('int', { default: 1 })
  version: number

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date
}
