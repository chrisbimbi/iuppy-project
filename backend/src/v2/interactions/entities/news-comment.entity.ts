import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity('news_comment')
@Index(['companyId', 'newsId'])
export class NewsCommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column() companyId!: string;
  @Column() newsId!: string;

  @Column({ nullable: true }) userId!: string | null;

  @Column('text')
  text!: string;

  @Column({ default: false })
  approved!: boolean;

  @Column({ nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}