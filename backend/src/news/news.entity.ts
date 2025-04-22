import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { News } from '@shared/types/News';
import { NewsType } from '@shared/types/NewsType';

@Entity()
export class NewEntity implements News {
  companyId: string;
  @Column({ default: false })
  isPublished: boolean;
  attachments: string[];
  highlightImages: string[];
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  subtitle?: string;

  @Column('text')
  content: string;

  @Column()
  channelId: string;

  @Column()
  authorId: string;

  @Column({
    type: 'enum',
    enum: NewsType,
    default: NewsType.ANNOUNCEMENT,
    nullable: true,
  })
  type: NewsType;

  @Column('json', { nullable: true })
  settings: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}