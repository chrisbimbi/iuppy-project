// backend/src/modules/forms/analytics/dto/analytics-query.dto.ts

import {
  IsOptional,
  IsString,
  IsIn,
  IsDateString,
  IsBoolean,
  IsArray,
} from 'class-validator';

export class AnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  @IsOptional()
  @IsString()
  status?: string;

  // Necessário pois forbidNonWhitelisted: true está ativo no main.ts
  @IsOptional()
  @IsString()
  companyId?: string;

  // Filtros de audiência (S2 Gap)
  @IsOptional()
  @IsString()
  spaceId?: string; // Pode ser um array, mas o Nest trata como string

  @IsOptional()
  @IsString()
  groupId?: string; // Pode ser um array

  @IsOptional()
  @IsIn(['all', 'internal', 'external'])
  audience?: 'all' | 'internal' | 'external';

  // Filtros de paginação
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;

  // Filtros de S3 (Friction)
  @IsOptional()
  @IsBoolean()
  includeDistributions?: boolean;
}
