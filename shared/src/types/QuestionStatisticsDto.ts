/**
 * Estatísticas de uma única questão dentro de uma survey.
 */
export interface QuestionStatisticsDto {
    /** ID da pergunta */
    questionId: string

    /** Quantos responderam esta pergunta */
    totalRespondents: number

    /** Para perguntas com opções (single, multi) */
    options?: Record<string, number>

    /** Para perguntas abertas (text) */
    answers?: string[]

    /** Para perguntas numéricas (stars, scale, nps): contagem por valor */
    distribution?: Record<number, number>

    /** Para perguntas numéricas (stars, scale): média */
    average?: number

    /** Somente para NPS: pontuação NPS */
    npsScore?: number
}