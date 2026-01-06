// backend/src/modules/surveys/dto/update-survey-question.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateSurveyQuestionDto } from './create-survey-question.dto';
export class UpdateSurveyQuestionDto extends PartialType(
  CreateSurveyQuestionDto,
) {}
