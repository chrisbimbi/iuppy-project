// src/v2/interactions/entities/interaction-event.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm'

export type InteractionEventType = 'OPEN' | 'ACK' | 'REACTION' | 'COMMENT' | 'SHARE'

@Entity('news_interaction_event')
@Index([`companyId`, `newsId`])
@Index([`companyId`, `newsId`, `userId`, `type`]) // apenas índice normal (NÃO-único)
export class InteractionEventEntity {
  @PrimaryGeneratedColumn('uuid') id!: string

  @Column() companyId!: string
  @Column() newsId!: string
  @Column({ nullable: true }) userId!: string | null

  @Column({ type: 'enum', enum: ['OPEN', 'ACK', 'REACTION', 'COMMENT', 'SHARE'] })
  type!: InteractionEventType

  @CreateDateColumn() createdAt!: Date

  /** metadados do evento (ex.: { origin:'push'|'app'|'web', tzOffsetMinutes, mid }) */
  @Column({ type: 'jsonb', nullable: true }) meta?: Record<string, any>
}