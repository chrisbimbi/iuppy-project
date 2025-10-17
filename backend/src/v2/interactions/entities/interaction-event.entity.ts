import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm'

export type InteractionEventType = 'OPEN' | 'ACK'

@Entity('news_interaction_event')
@Index(['companyId', 'newsId'])
export class InteractionEventEntity {
  @PrimaryGeneratedColumn('uuid') id!: string

  @Column() companyId!: string
  @Column() newsId!: string
  @Column({ nullable: true }) userId!: string | null

  @Column({ type: 'enum', enum: ['OPEN', 'ACK'] })
  type!: InteractionEventType

  @CreateDateColumn() createdAt!: Date

  /** metadados do evento (ex.: { origin:'push'|'app'|'web', tzOffsetMinutes, mid }) */
  @Column({ type: 'jsonb', nullable: true }) meta?: Record<string, any>
}
