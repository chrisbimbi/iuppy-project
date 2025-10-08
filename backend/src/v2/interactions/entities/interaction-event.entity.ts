import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, Unique } from 'typeorm';

export type InteractionEventType = 'OPEN' | 'ACK';

@Entity('news_interaction_event')
@Index(['companyId', 'newsId'])
@Unique('uq_news_interaction_event_company_news_user_type', ['companyId','newsId','userId','type'])
export class InteractionEventEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column() companyId!: string;
  @Column() newsId!: string;
  @Column({ nullable: true }) userId!: string | null;

  @Column({ type: 'enum', enum: ['OPEN', 'ACK'] })
  type!: InteractionEventType;

  @CreateDateColumn() createdAt!: Date;

  @Column({ type: 'jsonb', nullable: true }) meta?: Record<string, any>;
}