// backend/src/news/news.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { News, NewsSettings } from '@shared/types';   // ← import settings type
import { NewsType } from '@shared/types/NewsType';

@Entity()
export class NewEntity implements News {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  companyId!: string;

  @Column()
  authorId!: string;

  @Column()
  channelId!: string;

  @Column({ default: false })
  isPublished!: boolean;

  @Column()
  title!: string;

  @Column({ nullable: true })
  subtitle?: string;

  @Column('text')
  content!: string;

  @Column({
    type: 'enum',
    enum: NewsType,
    default: NewsType.ANNOUNCEMENT,
  })
  type!: NewsType;

  @Column('simple-json', { nullable: true })
  attachments!: string[];

  @Column('simple-json', { nullable: true })
  highlightImages!: string[];

  // Now typed to match the shared NewsSettings interface
  @Column('json', { nullable: false, default: {} })
  settings!: NewsSettings;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}