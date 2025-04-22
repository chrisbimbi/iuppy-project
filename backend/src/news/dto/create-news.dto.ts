import { 
  IsNotEmpty, IsString, IsOptional, IsEnum, IsBoolean, IsArray, ValidateNested, IsUUID 
} from 'class-validator';
import { Type } from 'class-transformer';
import { NewsType } from '@shared/types/NewsType';
import { NewSettingsDto } from './news-settings-dto';

export class CreateNewDto {
  @IsNotEmpty() @IsString() title: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsNotEmpty() @IsString() content: string;

  @IsNotEmpty() @IsUUID() channelId: string;
  @IsNotEmpty() @IsUUID() authorId: string;
  @IsNotEmpty() @IsUUID() companyId: string;

  @IsEnum(NewsType) type: NewsType;
  @IsBoolean() isPublished: boolean;

  @IsArray() attachments: any[];
  @IsArray() highlightImages: any[];

  @ValidateNested() @Type(() => NewSettingsDto)
  settings: NewSettingsDto;
}
