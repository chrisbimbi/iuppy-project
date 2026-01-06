// backend/src/modules/forms/analytics/dto/analytics-body.dto.ts

import {
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsIn,
  IsDateString,
} from 'class-validator';

export class AckBadgeDto {
  @IsOptional()
  @IsString()
  formId?: string;

  @IsOptional()
  @IsBoolean()
  all?: boolean;
}

export class ExportDto {
  @IsOptional()
  @IsString()
  formId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsIn(['csv', 'xlsx'])
  format?: 'csv' | 'xlsx';

  @IsOptional()
  @IsArray()
  include?: string[];

  @IsOptional()
  filters?: any;
}
