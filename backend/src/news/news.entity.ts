import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { News, NewsSettings } from '@shared/types';
import { NewsType } from '@shared/types/NewsType';

@Entity()
export class NewsEntity implements News {
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

  // Mantém o shape do shared NewsSettings
  @Column('jsonb', { nullable: false, default: {} })
  settings!: NewsSettings;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /** Usado para "snapshot" de audiência no momento da publicação (jsonb ou null) */
  @Column('jsonb', { nullable: true })
  audienceSnapshotAtPublish?: any;
}