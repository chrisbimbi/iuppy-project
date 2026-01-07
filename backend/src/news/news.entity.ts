import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { News, NewsSettings } from '@shared/types';

import { Channel } from '../channels/channel.entity';
import { JoinColumn, ManyToOne } from 'typeorm';

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

  @ManyToOne(() => Channel)
  @JoinColumn({ name: 'channelId' })
  channel?: Channel;

  @Column({ default: false })
  isPublished!: boolean;

  @Column({ default: false })
  mustAcknowledge!: boolean;

  @Column()
  title!: string;

  @Column({ nullable: true })
  subtitle?: string;

  @Column('text')
  content!: string;

  @Column('text', { array: true, nullable: true, default: {} })
  hashtags!: string[];

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

  // --- GAMIFICATION ---
  @Column({ type: 'int', nullable: true })
  xpOverride?: number;


  // --- AI FEATURES ---
  @Column('float', { array: true, nullable: true })
  embedding?: number[];

  @Column('float', { nullable: true })
  sentiment_score?: number;

  @Column({ nullable: true })
  sentiment_label?: string;

  @Column('text', { nullable: true })
  ai_summary?: string;

  @Column('text', { array: true, nullable: true })
  ai_tags?: string[];
}
