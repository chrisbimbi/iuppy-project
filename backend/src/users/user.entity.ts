// backend/src/users/user.entity.ts
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

  // 🔹 Flag de atividade do usuário (necessária pro Audience COMPANY)
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  groups: string[];

  @ManyToMany(() => GroupEntity, (group) => group.members)
  memberOf: GroupEntity[];

  @Column('text', { array: true, nullable: true })
  visibleGroups?: string[];

  // Campos opcionais adicionais
  @Column({ type: 'text', nullable: true })
  phone?: string | null;

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  locale?: string | null;

  // Refresh token hash (controle do Auth)
  @Column({ name: 'refreshTokenHash', type: 'text', nullable: true, select: false })
  refreshTokenHash?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
