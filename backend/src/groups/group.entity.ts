import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { UserGroupType } from '@shared/types';

@Entity('user_group')
export class GroupEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false })
  isAutoCreated: boolean;

  @Column({ length: 100, unique: true, nullable: true })
  identifier?: string;

  @Column({
    type: 'enum',
    enum: UserGroupType,
    default: UserGroupType.INTERNAL,
  })
  type: UserGroupType;

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  conditions: string[];

  @Column({ default: false })
  isChatEnabled: boolean;

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  adminIds: string[];

  @ManyToMany(() => UserEntity, (user) => user.memberOf, { cascade: false })
  @JoinTable({
    name: 'user_group_members',
    joinColumn: { name: 'group_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  members: UserEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
