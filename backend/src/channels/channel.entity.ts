import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Channel as ChannelInterface } from '@shared/types/Channel';

@Entity()
export class Channel implements ChannelInterface {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  companyId: string;

  // renomeie a coluna no banco para space_ids (já feito na migração)
  @Column('text', { array: true, nullable: true, name: 'space_ids' })
  spaceIds?: string[];

  @Column('text', { array: true, nullable: true })
  groupIds?: string[];
}
