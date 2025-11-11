import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm'

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
