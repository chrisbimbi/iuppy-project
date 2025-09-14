import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, Unique } from 'typeorm';

@Entity('news_reaction')
@Index(['companyId', 'newsId'])
@Unique('uniq_user_reaction_per_news', ['companyId', 'newsId', 'userId'])
export class NewsReactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column() companyId!: string;
  @Column() newsId!: string;
  @Column({ nullable: true }) userId!: string | null;

  @Column()
  reaction!: 'like' | 'love' | 'clap' | 'smile' | 'neutral' | 'angry';

  @CreateDateColumn()
  createdAt!: Date;
}