import { 
  IsOptional, IsString, IsEnum, IsBoolean, IsArray, ValidateNested, IsUUID 
} from 'class-validator';
import { Type } from 'class-transformer';
import { NewsType } from '@shared/types/NewsType';
import { NewSettingsDto } from './news-settings-dto';

export class UpdateNewDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() content?: string;

  @IsOptional() @IsUUID() channelId?: string;
  @IsOptional() @IsUUID() authorId?: string;
  @IsOptional() @IsUUID() companyId?: string;

  @IsOptional() @IsEnum(NewsType) type?: NewsType;
  @IsOptional() @IsBoolean() isPublished?: boolean;

  @IsOptional() @IsArray() attachments?: any[];
  @IsOptional() @IsArray() highlightImages?: any[];

  @IsOptional()
  @ValidateNested() @Type(() => NewSettingsDto)
  settings?: NewSettingsDto;
}
