import { SurveyAnswer } from './SurveyResponse'

/**
 * Payload para criação de resposta de Survey
 */
export interface CreateSurveyResponseDto {
    surveyId: string
    userId?: string
    answers: SurveyAnswer[]
}