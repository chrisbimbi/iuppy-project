import { IsEmail, IsOptional, IsString, IsEnum } from 'class-validator';
import { Role } from '@shared/types/Role';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  spaceId?: string;

  @IsOptional()
  groups?: string[];

  @IsOptional()
  visibleGroups?: string[];

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  preferredName?: string;

  @IsOptional()
  birthDate?: Date;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  academicLevel?: string;

  @IsOptional()
  @IsString()
  raceColor?: string;

  @IsOptional()
  @IsString()
  disabilityType?: string;

  // --- Documentos ---
  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  rg?: string;

  @IsOptional()
  @IsString()
  rgIssuer?: string;

  @IsOptional()
  @IsString()
  rgState?: string;

  @IsOptional()
  rgIssueDate?: Date;

  @IsOptional()
  @IsString()
  pis?: string;

  @IsOptional()
  @IsString()
  ctpsNumber?: string;

  @IsOptional()
  @IsString()
  ctpsSeries?: string;

  @IsOptional()
  @IsString()
  ctpsState?: string;

  @IsOptional()
  @IsString()
  voterId?: string;

  // --- Contato e Endereço ---
  @IsOptional()
  @IsEmail()
  secondaryEmail?: string;

  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @IsOptional()
  @IsString()
  mobilePhone?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  addressStreet?: string;

  @IsOptional()
  @IsString()
  addressNumber?: string;

  @IsOptional()
  @IsString()
  addressComplement?: string;

  @IsOptional()
  @IsString()
  addressNeighborhood?: string;

  @IsOptional()
  @IsString()
  addressCity?: string;

  @IsOptional()
  @IsString()
  addressState?: string;

  @IsOptional()
  @IsString()
  addressZipCode?: string;

  // --- Emprego e Hierarquia ---
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  costCenter?: string;

  @IsOptional()
  @IsString()
  legalEntity?: string;

  @IsOptional()
  @IsString()
  contractType?: string;

  @IsOptional()
  @IsString()
  employmentStatus?: string;

  @IsOptional()
  @IsString()
  workShift?: string;

  @IsOptional()
  @IsString()
  managerEmail?: string;

  @IsOptional()
  @IsString()
  positionId?: string;

  @IsOptional()
  hireDate?: Date;

  @IsOptional()
  terminationDate?: Date;

  @IsOptional()
  probationEndDate?: Date;

  @IsOptional()
  payrollData?: any;

  @IsOptional()
  vacationData?: any;

  @IsOptional()
  customAttributes?: any;

  @IsOptional()
  syncKey?: string;
}
