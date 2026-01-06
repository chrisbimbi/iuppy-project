import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('news_comment')
@Index(['companyId', 'newsId'])
export class NewsCommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companyId!: string;

  @Column('uuid')
  newsId!: string;

  @Column('uuid', { nullable: true })
  userId!: string | null;

  @Column('text')
  text!: string;

  @Column({ default: false })
  approved!: boolean;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
