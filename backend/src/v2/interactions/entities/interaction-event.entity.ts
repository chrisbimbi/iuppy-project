import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm'

export type InteractionEventType = 'OPEN' | 'ACK' | 'REACTION' | 'COMMENT' | 'SHARE'

@Entity('news_interaction_event')
@Index(['companyId', 'newsId'])
@Index(['companyId', 'newsId', 'userId', 'type'])
export class InteractionEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  companyId!: string

  @Column('uuid')
  newsId!: string

  @Column('uuid', { nullable: true })
  userId!: string | null

  @Column({ type: 'enum', enum: ['OPEN', 'ACK', 'REACTION', 'COMMENT', 'SHARE'] })
  type!: InteractionEventType

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  /** metadados do evento (ex.: { origin:'push'|'app'|'web', tzOffsetMinutes, mid }) */
  @Column({ type: 'jsonb', nullable: true })
  meta?: Record<string, any>
}