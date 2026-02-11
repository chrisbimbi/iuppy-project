import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Role } from '@shared/types/Role';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsNotEmpty()
  @IsString()
  companyId: string;

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
  jobTitle?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  hireDate?: Date;

  @IsOptional()
  birthDate?: Date;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  costCenter?: string;

  @IsOptional()
  terminationDate?: Date;

  @IsOptional()
  payrollData?: any;

  @IsOptional()
  vacationData?: any;

  @IsOptional()
  @IsString()
  contractType?: string;

  @IsOptional()
  @IsString()
  workShift?: string;

  @IsOptional()
  @IsString()
  managerEmail?: string;
}
