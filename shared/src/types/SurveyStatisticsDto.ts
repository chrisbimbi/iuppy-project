import { QuestionStatisticsDto } from './QuestionStatisticsDto'

export interface SurveyStatisticsDto {
  surveyId: string
  totalResponses: number

  /** % de respostas anônimas no resultado filtrado */
  anonymousRate?: number

  /** % que respondeu todas as perguntas */
  completionRate?: number

  /** janela temporal (após filtros) */
  windowFrom?: string
  windowTo?: string

  /** série de respostas por dia (AAAA-MM-DD) */
  responsesOverTime?: { date: string; count: number }[]

  /** Heatmap por dia (0=Dom..6=Sáb) x hora (0..23) */
  responsesHeatmap?: { day: number; hour: number; count: number }[]

  /** agregados */
  npsOverall?: { npsScore: number; promoters: number; passives: number; detractors: number }
  starsAverage?: number
  scaleAverage?: number

  /** estatísticas por pergunta */
  questions: QuestionStatisticsDto[]
}