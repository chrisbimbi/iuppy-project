import { SurveyQuestionType } from './SurveyQuestion'

/**
 * Payload para criação de pergunta
 */
export interface CreateSurveyQuestionDto {
    order: number
    type: SurveyQuestionType
    questionText: string
    description?: string
    isRequired: boolean
    shuffleOptions?: boolean
    options?: string[]
}