import { Entity, PrimaryColumn, CreateDateColumn, Index, Column } from 'typeorm';

@Entity('news_audience')
@Index(['companyId', 'newsId'])
@Index(['userId'])
export class NewsAudienceEntity {
  @PrimaryColumn('uuid')
  companyId!: string;

  @PrimaryColumn('uuid')
  newsId!: string;

  @PrimaryColumn('uuid')
  userId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'text', nullable: true })
  origemDaRegra?: string;
}