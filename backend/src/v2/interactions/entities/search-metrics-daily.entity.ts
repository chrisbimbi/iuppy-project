import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('search_metrics_daily')
@Index(['companyId', 'date'])
export class SearchMetricsDailyEntity {
  @PrimaryColumn('uuid')
  companyId!: string;

  @PrimaryColumn('date')
  date!: string; // YYYY-MM-DD

  @PrimaryColumn({ type: 'varchar', length: 64 })
  queryHash!: string;

  @Column({ type: 'text', nullable: true })
  sampleQuery?: string | null;

  @Column('integer', { default: 0 })
  queries!: number;

  @Column('integer', { default: 0 })
  uniqueUsers!: number;
}