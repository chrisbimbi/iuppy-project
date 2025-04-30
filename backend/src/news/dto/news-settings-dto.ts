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

  @IsBoolean() allowComments!: boolean;
  @IsBoolean() moderateComments!: boolean;
  @IsBoolean() allowReactions!: boolean;
  @IsBoolean() notifyUsers!: boolean;

  @IsBoolean() pushNotification!: boolean;
  @ValidateIf(o => o.pushNotification)
  @IsOptional() @IsString() pushTitle?: string;
  @ValidateIf(o => o.pushNotification)
  @IsOptional() @IsString() pushContent?: string;

  @IsBoolean() emailNotification!: boolean;

  @IsBoolean() inAppNotification!: boolean;

  @IsBoolean() allowSharing!: boolean;
  @IsBoolean() showAuthor!: boolean;
  @IsBoolean() showPublishDate!: boolean;
  @IsBoolean() pinToTop!: boolean;

  @IsBoolean() schedulePublication!: boolean;
  @ValidateIf(o => o.schedulePublication)
  @IsDateString() schedulePublishDate?: string;

  @IsBoolean() expirePublication!: boolean;
  @ValidateIf(o => o.expirePublication)
  @IsDateString() expirationDate?: string;

  @IsBoolean() acknowledgementRequired!: boolean;

  @IsOptional() @IsInt() @Min(1) maxAudienceSize?: number;
  @IsBoolean() restrictAccess!: boolean;
}