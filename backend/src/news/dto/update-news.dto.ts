import {
  IsOptional,
  IsUUID,
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { NewSettingsDto } from './news-settings-dto';

export class UpdateNewDto {
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  authorId?: string;

  @IsOptional()
  @IsUUID()
  channelId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  content?: string;

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

  @IsOptional()
  @ValidateNested()
  @Type(() => NewSettingsDto)
  settings?: NewSettingsDto;

  @IsOptional()
  @IsBoolean()
  mustAcknowledge?: boolean;

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
