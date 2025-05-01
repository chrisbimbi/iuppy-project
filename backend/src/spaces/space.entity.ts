import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Space } from '@shared/types/Space';

@Entity('space')
export class SpaceEntity implements Space {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ type: 'int', default: 1 })
  priority: number;

  @Column({ default: true })
  active: boolean;

  // novos campos
  @Column('text', { array: true, default: () => `ARRAY['app']` })
  distributionChannels: ('app' | 'email')[];

  @Column('text', { array: true, nullable: true })
  targetGroupIds?: string[];

  @Column('text', { array: true, nullable: true })
  adminIds?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}