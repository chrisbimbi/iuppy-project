// shared/src/types/SurveyResponse.ts

/**
 * Resposta de uma única questão
 */
export interface SurveyAnswer {
    questionId: string
    answer: string | string[] | number
}

/**
 * Registro de resposta de um usuário (ou anônimo)
 */
export interface SurveyResponse {
    id: string
    surveyId: string
    userId?: string      // undefined em caso anônimo
    answers: SurveyAnswer[]
    submittedAt: Date
}