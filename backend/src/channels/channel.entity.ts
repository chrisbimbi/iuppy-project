import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Channel as ChannelInterface } from '@shared/types/Channel';

@Entity('channel')
export class Channel implements ChannelInterface {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  companyId: string;

  @Column('text', { array: true, nullable: true, name: 'space_ids' })
  spaceIds?: string[];

  @Column('text', { array: true, nullable: true, name: 'group_ids' })
  groupIds?: string[];

  @Column('text', { array: true, nullable: true, name: 'contributor_ids' })
  contributorIds?: string[];

  @Column('text', { array: true, nullable: true, name: 'admin_ids' })
  adminIds?: string[];
}