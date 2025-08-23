import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToMany,
} from 'typeorm';
import { Role, User } from '@shared/types';
import { GroupEntity } from '../groups/group.entity';

@Entity('user_entity')
export class UserEntity implements User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  displayName?: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.HRAdmin })
  role: Role;

  @Column()
  companyId: string;

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  groups: string[];

  @ManyToMany(() => GroupEntity, (group) => group.members)
  memberOf: GroupEntity[];

  @Column('text', { array: true, nullable: true })
  visibleGroups?: string[];

  @Column({ name: 'refreshTokenHash', type: 'text', nullable: true, select: false })
  refreshTokenHash?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}