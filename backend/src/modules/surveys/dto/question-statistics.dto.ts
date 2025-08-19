// backend/src/modules/surveys/dto/question-statistics.dto.ts

/**
 * Estatísticas de uma única questão dentro de uma survey.
 */
export class QuestionStatisticsDto {
    questionId: string;
    totalRespondents: number;

    /** para perguntas com opções (single, multi) */
    options?: Record<string, number>;

    /** para perguntas abertas (text) */
    answers?: string[];

    /** para perguntas numéricas (stars, scale, nps): contagem por valor */
    distribution?: Record<number, number>;

    /** para perguntas numéricas (stars, scale): média */
    average?: number;

    /** somente para NPS: pontuação NPS */
    npsScore?: number;
}