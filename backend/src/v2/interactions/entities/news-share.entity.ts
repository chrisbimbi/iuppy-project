import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity('news_share')
@Index(['companyId', 'newsId'])
export class NewsShareEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column() companyId!: string;
  @Column() newsId!: string;
  @Column({ nullable: true }) userId!: string | null;

  @Column({ default: 'app' })
  channel!: 'app' | 'external';

  @Column({ type: 'jsonb', nullable: true })
  meta?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;
}