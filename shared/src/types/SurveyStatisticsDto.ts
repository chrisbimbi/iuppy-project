import { QuestionStatisticsDto } from './QuestionStatisticsDto'

/**
 * Estatísticas agregadas de uma survey inteira.
 */
export interface SurveyStatisticsDto {
    /** ID da survey */
    surveyId: string

    /** Total de respostas recebidas na survey */
    totalResponses: number

    /** Estatísticas por cada pergunta */
    questions: QuestionStatisticsDto[]
}