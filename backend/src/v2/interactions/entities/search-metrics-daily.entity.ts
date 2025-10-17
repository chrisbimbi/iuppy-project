import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('search_metrics_daily')
@Index(['companyId', 'date'])
export class SearchMetricsDailyEntity {
  @PrimaryColumn('uuid')
  companyId: string;

  // YYYY-MM-DD
  @PrimaryColumn('date')
  date: string;

  // Hash da consulta (para privacidade)
  @PrimaryColumn('text')
  queryHash: string;

  @Column('integer', { default: 0 })
  queries: number;

  @Column('integer', { default: 0 })
  uniqueUsers: number;

  @Column('text', { nullable: true })
  sampleQuery: string | null;
}