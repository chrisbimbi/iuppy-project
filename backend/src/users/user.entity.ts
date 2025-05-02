// backend/src/users/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Role, User } from '@shared/types';
import { GroupEntity } from 'src/groups/group.entity';

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

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column()
  companyId: string;

  /** lista de _IDs_ de grupos — corresponde ao seu `User.groups: string[]` */
  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  groups: string[];

  /** relação M:N com GroupEntity */
  @ManyToMany(() => GroupEntity, (g) => g.members)
  @JoinTable({
    name: 'user_group_members',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'group_id', referencedColumnName: 'id' },
  })
  memberOf: GroupEntity[];

  @Column('text', { array: true, nullable: true })
  visibleGroups?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}