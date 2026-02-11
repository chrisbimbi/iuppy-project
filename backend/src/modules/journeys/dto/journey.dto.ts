import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsNumber,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  JourneyTriggerType,
  JourneyRestartPolicy,
} from '../entities/journey.entity';
import { StepContentType, StepMediaType } from '../entities/journey-step.entity';

export class CreateJourneyStepDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  title: string;

  @IsNumber()
  delayDays: number;

  @IsOptional()
  @IsString()
  releaseTime?: string;

  @IsEnum(StepContentType)
  contentType: StepContentType;

  @IsOptional()
  @IsEnum(StepMediaType)
  mediaType?: StepMediaType;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  videoConfig?: any;

  @IsOptional()
  @IsBoolean()
  requireAck?: boolean;

  @IsOptional()
  formConfig?: any;

  @IsOptional()
  pollConfig?: any;

  @IsOptional()
  quizConfig?: any;

  @IsOptional()
  contentPayload?: any;

  @IsOptional()
  smartFields?: any;

  @IsNumber()
  orderIndex: number;

  @IsOptional()
  @IsString()
  pushTitle?: string;

  @IsOptional()
  @IsString()
  pushMessage?: string;
}

export class CreateJourneyDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(JourneyTriggerType)
  triggerType: JourneyTriggerType;

  @IsOptional()
  @IsString()
  targetGroupId?: string;

  @IsOptional()
  targetAudience?: any;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsString()
  gamificationId?: string;

  @IsEnum(JourneyRestartPolicy)
  restartPolicy: JourneyRestartPolicy;

  @IsBoolean()
  active: boolean;

  @IsString()
  companyId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJourneyStepDto)
  steps?: CreateJourneyStepDto[];

  @IsOptional()
  @IsBoolean()
  isNr1?: boolean;
}

import { PartialType } from '@nestjs/mapped-types';

export class UpdateJourneyDto extends PartialType(CreateJourneyDto) { }
