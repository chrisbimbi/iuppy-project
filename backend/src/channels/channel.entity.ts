import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Channel as ChannelInterface, ChannelType } from '@shared/types/Channel';

@Entity('channel')
export class Channel implements ChannelInterface {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ChannelType, default: ChannelType.ARTICLES })
  type: ChannelType;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: false, name: 'is_published' })
  isPublished?: boolean;

  @Column()
  companyId: string;

  @Column('uuid', { array: true, nullable: true, name: 'space_ids' })
  spaceIds?: string[];
  
  @Column('text', { array: true, nullable: true, name: 'group_ids' })
  groupIds?: string[];

  @Column('text', { array: true, nullable: true, name: 'contributor_ids' })
  contributorIds?: string[];

  @Column('text', { array: true, nullable: true, name: 'admin_ids' })
  adminIds?: string[];

  // NOVO: posição para ordenação
  @Column({ default: 0 })
  position: number;
}