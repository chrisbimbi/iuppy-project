import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('form_metrics_daily')
@Index(['companyId', 'formId', 'date'])
export class FormMetricsDailyEntity {
  @PrimaryColumn('uuid')
  companyId: string;

  @PrimaryColumn('uuid')
  formId: string;

  @PrimaryColumn({ type: 'date' })
  date: string;

  @Column({ type: 'int', nullable: true, default: 0 })
  eligibles: number;

  @Column({ type: 'int', default: 0 })
  impressions: number;

  @Column({ type: 'int', default: 0 })
  opens: number;

  @Column({ type: 'int', default: 0 })
  starts: number;

  @Column({ type: 'int', default: 0 })
  submits: number;

  @Column({ type: 'int', default: 0 })
  onTimeSubmits: number;

  @Column({ type: 'int', default: 0 })
  internalSubmits: number;

  @Column({ type: 'int', default: 0 })
  externalSubmits: number;

  @Column({ type: 'int', default: 0 })
  pushSent: number;

  @Column({ type: 'int', default: 0 })
  pushOpened: number;

  @Column({ type: 'int', default: 0 })
  emailSent: number;

  @Column({ type: 'int', default: 0 })
  emailOpened: number;

  @Column({ type: 'int', default: 0 })
  emailClicked: number;
}
