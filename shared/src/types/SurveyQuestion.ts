// shared/src/types/SurveyQuestion.ts

/**
 * Tipos de pergunta suportados
 */
export enum SurveyQuestionType {
    Text = 'text',
    Single = 'single',
    Multi = 'multi',
    Scale = 'scale',
    Stars = 'stars',
    Nps = 'nps',
}

/**
 * Cada pergunta pertence a uma Survey via surveyId
 */
export interface SurveyQuestion {
    id: string
    surveyId: string
    order: number
    type: SurveyQuestionType
    questionText: string
    description?: string
    isRequired: boolean
    shuffleOptions?: boolean
    options?: string[]    // para perguntas de escolha
}