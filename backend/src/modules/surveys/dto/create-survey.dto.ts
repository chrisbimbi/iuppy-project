// backend/src/modules/surveys/dto/create-survey.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayNotEmpty,
  IsBoolean,
  IsDateString,
  IsUUID,
  IsOptional,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { SurveyStatus } from '../entities/survey.entity';

export class CreateSurveyDto {
  @IsNotEmpty()
  @IsUUID()
  companyId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsUUID()
  authorId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  adminIds: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  spaceIds: string[];

  // --- visibilidade / grupos ---
  @IsEnum(['public', 'private', 'specific_groups', 'journey_only'])
  visibility: 'public' | 'private' | 'specific_groups' | 'journey_only';

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  @ValidateIf((o) => o.visibility === 'specific_groups')
  @ArrayNotEmpty()
  groupIds?: string[];

  // --- notificações / entrega ---
  @IsBoolean()
  notifyUsers: boolean;

  @IsBoolean()
  emailNotification: boolean;

  @IsBoolean()
  inAppNotification: boolean;

  @IsBoolean()
  pushNotification: boolean;

  @IsOptional()
  @IsString()
  pushTitle?: string;

  @IsOptional()
  @IsString()
  pushContent?: string;

  @IsBoolean()
  acknowledgementRequired: boolean;

  // --- agendamento / expiração ---
  @IsBoolean()
  scheduleSurvey: boolean;

  @IsBoolean()
  expireSurvey: boolean;

  @ValidateIf((o) => o.scheduleSurvey === true)
  @IsDateString()
  startsAt: string;

  @ValidateIf((o) => o.expireSurvey === true)
  @IsDateString()
  endsAt: string;

  @IsBoolean()
  isAnonymous: boolean;

  @IsOptional()
  @IsString()
  status?: SurveyStatus;
}
