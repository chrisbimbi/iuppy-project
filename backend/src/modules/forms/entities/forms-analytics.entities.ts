import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm'

/**
 * Eventos de uso do formulário (append-only)
 */
@Entity('form_event')
@Index(['companyId', 'formId'])
@Index(['companyId', 'ts'])
export class FormEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  companyId: string

  @Column('uuid')
  formId: string

  @Column('text')
  type: string

  @Column('uuid', { nullable: true })
  userId: string | null

  @Column('boolean', { default: false })
  external: boolean

  @Column('text', { nullable: true })
  externalEmail: string | null

  @Column('uuid', { nullable: true })
  fieldId: string | null

  @Column('jsonb', { nullable: true })
  meta: any | null

  @Column('timestamptz')
  ts: Date
}

/**
 * Evento de notificação (compartilhável)
 */
@Entity('notification_event')
@Index(['companyId', 'objectId'])
@Index(['companyId', 'ts'])
export class NotificationEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  companyId: string

  @Column('text')
  objectType: string // 'form'

  @Column('uuid')
  objectId: string

  @Column('text')
  channel: 'push' | 'email' | 'webhook'

  @Column('text')
  type: string // scheduled|sent|delivered|opened|clicked|failed

  @Column('uuid', { nullable: true })
  userId: string | null

  @Column('text', { nullable: true })
  externalEmail: string | null

  @Column('int', { nullable: true })
  latencyMs: number | null

  @Column('text', { nullable: true })
  status: string | null

  @Column('jsonb', { nullable: true })
  meta: any | null

  @Column('timestamptz')
  ts: Date
}

/**
 * Lembretes
 */
@Entity('reminder_event')
@Index(['companyId', 'formId'])
@Index(['companyId', 'ts'])
export class ReminderEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  companyId: string

  @Column('uuid')
  formId: string

  @Column('text')
  kind: string // D-1, D-2, ...

  @Column('text')
  type: string // scheduled|sent|opened

  @Column('uuid', { nullable: true })
  userId: string | null

  @Column('text', { nullable: true })
  externalEmail: string | null

  @Column('jsonb', { nullable: true })
  meta: any | null

  @Column('timestamptz')
  ts: Date
}

/**
 * métricas diárias do form
 */
@Entity('form_metrics_daily')
@Index(['companyId', 'formId', 'date'], { unique: true })
export class FormMetricsDailyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  companyId: string

  @Column('uuid')
  formId: string

  @Column('date')
  date: string

  @Column('int', { default: 0 })
  eligibles: number

  @Column('int', { default: 0 })
  impressions: number

  @Column('int', { default: 0 })
  opens: number

  @Column('int', { default: 0 })
  starts: number

  @Column('int', { default: 0 })
  submits: number

  @Column('int', { default: 0 })
  onTimeSubmits: number

  @Column('int', { default: 0 })
  internalSubmits: number

  @Column('int', { default: 0 })
  externalSubmits: number

  @Column('int', { default: 0 })
  pushSent: number

  @Column('int', { default: 0 })
  pushOpened: number

  @Column('int', { default: 0 })
  emailSent: number

  @Column('int', { default: 0 })
  emailOpened: number

  @Column('int', { default: 0 })
  emailClicked: number
}

/**
 * state de badge por cmsUser
 */
@Entity('form_badge_state')
@Index(['companyId', 'cmsUserId', 'formId'], { unique: true })
export class FormBadgeStateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  companyId: string

  @Column('uuid')
  cmsUserId: string

  @Column('uuid')
  formId: string

  @Column('timestamptz', { nullable: true })
  lastSeenAt: Date | null

  @Column('int', { default: 0 })
  newCount: number
}
