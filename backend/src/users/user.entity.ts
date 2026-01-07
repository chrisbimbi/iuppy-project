// backend/src/users/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { Role, User } from '@shared/types';
import { GroupEntity } from '../groups/group.entity';
import { UserXPHistoryEntity } from '../modules/gamification/entities/user-xp-history.entity';

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

  // 🔹 ERP Fields for Segmentation
  @Column({ type: 'text', nullable: true })
  department?: string | null;

  @Column({ type: 'text', nullable: true })
  jobTitle?: string | null;

  @Column({ type: 'text', nullable: true })
  location?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  hireDate?: Date | null;

  @Column({ type: 'jsonb', default: {} })
  customAttributes: Record<string, any>;

  // 🔹 Sync Key for ERP Integration
  @Column({ type: 'text', nullable: true, unique: true })
  syncKey?: string | null;

  // Refresh token hash (controle do Auth)
  @Column({
    name: 'refreshTokenHash',
    type: 'text',
    nullable: true,
    select: false,
  })
  refreshTokenHash?: string | null;

  @Column({ type: 'text', nullable: true, select: false })
  otpCode?: string | null;

  @Column({ type: 'timestamp', nullable: true, select: false })
  otpExpiresAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  firstLoginAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date | null;

  @Column({ type: 'int', default: 0 })
  xp: number;

  @OneToMany(() => UserXPHistoryEntity, (history) => history.user)
  xpHistory: UserXPHistoryEntity[];

  @UpdateDateColumn()
  updatedAt: Date;
}
