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
import { UserSpaceEntity } from '../spaces/user-space.entity';

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

  // --- Nome e Pessoal ---
  @Column({ nullable: true })
  middleName?: string | null;

  @Column({ nullable: true })
  preferredName?: string | null;

  @Column({ type: 'date', nullable: true })
  birthDate?: Date | null;

  @Column({ type: 'text', nullable: true })
  gender?: string | null;

  @Column({ nullable: true })
  maritalStatus?: string | null;

  @Column({ nullable: true })
  nationality?: string | null;

  @Column({ type: 'text', nullable: true })
  academicLevel?: string | null;

  @Column({ nullable: true })
  raceColor?: string | null;

  @Column({ nullable: true })
  disabilityType?: string | null;

  // --- Documentos ---
  @Column({ type: 'text', nullable: true })
  cpf?: string | null;

  @Column({ type: 'text', nullable: true })
  rg?: string | null;

  @Column({ nullable: true })
  rgIssuer?: string | null;

  @Column({ nullable: true })
  rgState?: string | null;

  @Column({ type: 'date', nullable: true })
  rgIssueDate?: Date | null;

  @Column({ nullable: true })
  pis?: string | null;

  @Column({ nullable: true })
  ctpsNumber?: string | null;

  @Column({ nullable: true })
  ctpsSeries?: string | null;

  @Column({ nullable: true })
  ctpsState?: string | null;

  @Column({ nullable: true })
  voterId?: string | null;

  // --- Contato e Endereço ---
  @Column({ nullable: true })
  secondaryEmail?: string | null;

  @Column({ nullable: true })
  personalEmail?: string | null;

  @Column({ type: 'text', nullable: true })
  mobilePhone?: string | null;

  @Column({ nullable: true })
  emergencyContactName?: string | null;

  @Column({ nullable: true })
  emergencyContactPhone?: string | null;

  @Column({ type: 'text', nullable: true })
  address?: string | null;

  @Column({ nullable: true })
  addressStreet?: string | null;

  @Column({ nullable: true })
  addressNumber?: string | null;

  @Column({ nullable: true })
  addressComplement?: string | null;

  @Column({ nullable: true })
  addressNeighborhood?: string | null;

  @Column({ nullable: true })
  addressCity?: string | null;

  @Column({ nullable: true })
  addressState?: string | null;

  @Column({ nullable: true })
  addressZipCode?: string | null;

  // --- Emprego e Hierarquia ---
  @Column({ type: 'text', nullable: true })
  registrationNumber?: string | null; // Matrícula / EmployeeID

  @Column({ type: 'text', nullable: true })
  jobTitle?: string | null;

  @Column({ type: 'text', nullable: true })
  department?: string | null;

  @Column({ type: 'text', nullable: true })
  costCenter?: string | null;

  @Column({ nullable: true })
  legalEntity?: string | null;

  @Column({ type: 'text', nullable: true })
  contractType?: string | null; // CLT, PJ, Estágio

  @Column({ nullable: true })
  employmentStatus?: string | null;

  @Column({ type: 'text', nullable: true })
  workShift?: string | null; // Turno A, 09:00-18:00

  @Column({ type: 'text', nullable: true })
  managerEmail?: string | null; // Primary hierarchy link

  @Column({ type: 'timestamp', nullable: true })
  admissionDate?: Date | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  salary?: number | null;

  @Column({ type: 'text', nullable: true })
  hiringType?: string | null;

  @Column({ nullable: true })
  positionId?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  hireDate?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  terminationDate?: Date | null;

  @Column({ type: 'date', nullable: true })
  probationEndDate?: Date | null;

  // 🔹 Flexible containers for complex ERP data (Holerite / Férias)
  @Column({ type: 'jsonb', nullable: true, default: {} })
  payrollData?: any; // Bank info, salary history, payslip links

  @Column({ type: 'jsonb', nullable: true, default: {} })
  vacationData?: any; // Periods, balance, history

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

  @OneToMany(() => UserSpaceEntity, (us) => us.user)
  userSpaces: UserSpaceEntity[];
}
