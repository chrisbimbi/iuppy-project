// src/users/user.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Role, User } from '@shared/types';

@Entity()
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

  @Column({ nullable: true })
  spaceId?: string;

  @Column('text', { array: true, nullable: true })
  groups?: string[];

  @Column('text', { array: true, nullable: true })
  visibleGroups?: string[];

  @Column({ nullable: true })
  recoveryToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  recoveryTokenExpiration?: Date;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  locale?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
export { User };

