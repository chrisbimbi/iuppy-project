// backend/src/modules/surveys/dto/create-survey-question.dto.ts
import {
  IsNotEmpty,
  IsUUID,
  IsInt,
  Min,
  IsEnum,
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { QuestionType } from '../entities/survey-question.entity';

export class CreateSurveyQuestionDto {
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  order: number;

  @IsEnum(['text', 'single', 'multi', 'stars', 'scale', 'nps'])
  type: QuestionType;

  @IsNotEmpty()
  @IsString()
  questionText: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsBoolean()
  isRequired: boolean;

  @IsOptional()
  @IsBoolean()
  shuffleOptions?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  options?: string[];
}
