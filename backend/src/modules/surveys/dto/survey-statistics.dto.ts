// backend/src/modules/surveys/dto/survey-statistics.dto.ts

import { QuestionStatisticsDto } from './question-statistics.dto';

/**
 * Estatísticas agregadas de uma survey inteira.
 */
export class SurveyStatisticsDto {
    surveyId: string;
    totalResponses: number;
    questions: QuestionStatisticsDto[];
}