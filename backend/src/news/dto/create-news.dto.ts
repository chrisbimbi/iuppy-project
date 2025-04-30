import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsArray
} from 'class-validator';
import { Type } from 'class-transformer';
import { NewsType } from '@shared/types/NewsType';
import { NewSettingsDto } from './news-settings-dto';

export class CreateNewDto {
  @IsNotEmpty() @IsUUID()
  companyId!: string;

  @IsNotEmpty() @IsUUID()
  authorId!: string;

  @IsNotEmpty() @IsUUID()
  channelId!: string;

  @IsNotEmpty() @IsString()
  title!: string;

  @IsOptional() @IsString()
  subtitle?: string;

  @IsNotEmpty() @IsString()
  content!: string;

  @IsOptional() @IsEnum(NewsType)
  type?: NewsType;

  @IsOptional() @IsBoolean()
  isPublished?: boolean;

  @IsOptional() @IsArray()
  attachments?: { url: string; name: string }[];

  @IsOptional() @IsArray()
  highlightImages?: { url: string; altText?: string }[];

  @ValidateNested() @Type(() => NewSettingsDto)
  settings!: NewSettingsDto;
}