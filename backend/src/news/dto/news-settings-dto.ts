// src/backend/src/news/dto/new-settings.dto.ts
import {
  IsEnum,
  IsBoolean,
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
  ArrayNotEmpty,
  ValidateIf,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum Visibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  SPECIFIC = 'specific_groups',
}

export class NewSettingsDto {
  @IsEnum(Visibility)
  visibility!: Visibility;

  @ValidateIf(o => o.visibility === Visibility.SPECIFIC)
  @IsArray()
  @ArrayNotEmpty()
  targetAudience?: string[];

  @IsBoolean()
  allowComments!: boolean;
  @IsBoolean()
  moderateComments!: boolean;
  @IsBoolean()
  allowReactions!: boolean;

  @IsBoolean()
  pushNotification!: boolean;
  @ValidateIf(o => o.pushNotification)
  @IsOptional() @IsString()
  pushTitle?: string;
  @ValidateIf(o => o.pushNotification)
  @IsOptional() @IsString()
  pushContent?: string;

    @IsBoolean()
  notifyUsers!: boolean;

  @IsBoolean()
  emailNotification!: boolean;

  @IsBoolean()
  inAppNotification!: boolean;

  @IsBoolean()
  allowSharing!: boolean;
  @ValidateIf(o => o.allowSharing)
  @IsOptional() @IsString()
  shareUrl?: string;
  @ValidateIf(o => o.allowSharing)
  @IsOptional() @IsString()
  shareText?: string;

  @IsBoolean()
  showAuthor!: boolean;
  @IsBoolean()
  showPublishDate!: boolean;   // se tiver data de publicação visível
  @IsBoolean()
  pinToTop!: boolean;

  @IsBoolean()
  schedulePublication!: boolean;
  @ValidateIf(o => o.schedulePublication)
  @IsDateString()
  schedulePublishDate?: string;

  @IsBoolean()
  expirePublication!: boolean;
  @ValidateIf(o => o.expirePublication)
  @IsDateString()
  expirationDate?: string;

  @IsBoolean()
  acknowledgementRequired!: boolean; // “Pedir confirmação do colaborador”

  @IsOptional() @IsInt() @Min(1)
  maxAudienceSize?: number;

  @IsBoolean()
  restrictAccess!: boolean;
}