import {
  IsOptional,
  IsUUID,
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

import { AudienceSelectionDto } from './audience-selection.dto';
import { NewSettingsDto } from './news-settings-dto';

export class CreateNewDto {
  // passaram a ser opcionais para não bloquear quando o backend sobrepõe pelo token
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  authorId?: string;

  @IsNotEmpty()
  @IsUUID()
  channelId!: string;

  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsNotEmpty()
  @IsString()
  content!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsArray()
  attachments?: { url: string; name: string }[];

  @IsOptional()
  @IsArray()
  highlightImages?: { url: string; altText?: string }[];

  @ValidateNested()
  @Type(() => NewSettingsDto)
  settings!: NewSettingsDto;

  // 🔥 Seleção de audiência (fora de settings)
  @IsOptional()
  @ValidateNested()
  @Type(() => AudienceSelectionDto)
  audience?: AudienceSelectionDto;

  @IsOptional()
  @IsBoolean()
  mustAcknowledge?: boolean;

  // 🔥 NR-1 Flag
  @IsOptional()
  @IsBoolean()
  isNr1?: boolean;

  // --- AI Fields ---
  @IsOptional()
  @IsString()
  ai_summary?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ai_tags?: string[];
}
