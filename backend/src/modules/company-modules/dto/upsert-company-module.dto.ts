import { IsBoolean, IsOptional, IsObject } from 'class-validator';

export class UpsertCompanyModuleDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}
