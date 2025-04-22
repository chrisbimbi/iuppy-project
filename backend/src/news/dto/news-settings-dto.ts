import { IsBoolean, IsOptional, IsString, IsDateString, IsArray, IsIn } from 'class-validator';

export class NewSettingsDto {
  @IsOptional()
  @IsIn(['public', 'private', 'specific_groups'])
  visibility?: string;

  @IsBoolean()
  allowComments: boolean;

  @IsBoolean()
  moderateComments: boolean;

  @IsBoolean()
  allowReactions: boolean;

  @IsBoolean()
  notifyUsers: boolean;

  @IsBoolean()
  pushNotification: boolean;

  @IsBoolean()
  emailNotification: boolean;

  @IsBoolean()
  allowSharing: boolean;

  @IsBoolean()
  showAuthor: boolean;

  @IsBoolean()
  showPublishDate: boolean;

  @IsBoolean()
  pinToTop: boolean;

  @IsBoolean()
  schedulePublication: boolean;

  @IsBoolean()
  expirePublication: boolean;

  @IsString()
  pushTitle: string;

  @IsString()
  pushContent: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsDateString()
  schedulePublishDate?: string;

  @IsArray()
  @IsString({ each: true })
  targetAudience: string[];
}