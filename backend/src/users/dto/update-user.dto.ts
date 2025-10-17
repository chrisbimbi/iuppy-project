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
}
