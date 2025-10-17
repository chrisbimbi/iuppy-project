import {
  IsOptional,
  IsUUID,
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { NewsType } from '@shared/types/NewsType';
import { NewSettingsDto } from './news-settings-dto';

export class UpdateNewDto {
  @IsOptional() @IsUUID()
  companyId?: string;

  @IsOptional() @IsUUID()
  authorId?: string;

  @IsOptional() @IsUUID()
  channelId?: string;

  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
  subtitle?: string;

  @IsOptional() @IsString()
  content?: string;

  @IsOptional() @IsEnum(NewsType)
  type?: NewsType;

  @IsOptional() @IsBoolean()
  isPublished?: boolean;

  @IsOptional() @IsArray()
  attachments?: { url: string; name: string }[];

  @IsOptional() @IsArray()
  highlightImages?: { url: string; altText?: string }[];

  @IsOptional()
  @ValidateNested()
  @Type(() => NewSettingsDto)
  settings?: NewSettingsDto;
}