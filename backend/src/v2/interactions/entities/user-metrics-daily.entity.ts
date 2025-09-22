import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('user_metrics_daily')
@Index(['userId', 'date'])
export class UserMetricsDailyEntity {
  @PrimaryColumn('uuid')
  userId: string;

  // YYYY-MM-DD
  @PrimaryColumn('date')
  date: string;

  @Column('integer', { default: 0 })
  appOpens: number;

  @Column('integer', { default: 0 })
  newsOpens: number;

  @Column('integer', { default: 0 })
  newsUniqueOpens: number;

  @Column('integer', { default: 0 })
  reactions: number;

  @Column('integer', { default: 0 })
  comments: number;

  @Column('integer', { default: 0 })
  shares: number;

  @Column('integer', { default: 0 })
  surveyResponses: number;
}