import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('news_metrics_daily')
@Index(['newsId', 'date'])
export class NewsMetricsDailyEntity {
  @PrimaryColumn('uuid')
  newsId: string;

  @PrimaryColumn('date')
  date: string; // YYYY-MM-DD

  @Column('integer', { default: 0 })
  opens: number;

  @Column('integer', { default: 0 })
  uniqueOpens: number;

  @Column('integer', { default: 0 })
  acks: number;

  @Column('integer', { default: 0 })
  reactions: number;

  @Column('integer', { default: 0 })
  comments: number;

  @Column('integer', { default: 0 })
  shares: number;
}