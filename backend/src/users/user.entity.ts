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

  // lista de IDs de grupos (campo legado, pode manter ou remover se não usar)
  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  groups: string[];

  // relação M-N propriamente dita
  @ManyToMany(() => GroupEntity, group => group.members)
  memberOf: GroupEntity[];

  @Column('text', { array: true, nullable: true })
  visibleGroups?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}