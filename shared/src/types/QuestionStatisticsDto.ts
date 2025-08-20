import { SurveyQuestionType } from './SurveyQuestion'

export interface QuestionStatisticsDto {
  /** id da pergunta */
  questionId: string

  /** título/enunciado da pergunta (render no frontend) */
  questionText?: string

  /** enum vindo de SurveyQuestion */
  type?: SurveyQuestionType

  /** total de respondentes (após filtros) */
  totalRespondents: number

  /** contadores de resposta/pulo */
  answeredCount?: number
  skippedCount?: number

  /** para single/multi */
  options?: Record<string, number>
  optionsPct?: Record<string, string> // ex: "34.5%"

  /** para text */
  answers?: string[]
  topWords?: Array<{ word: string; count: number }>
  /** novos */
  bigrams?: Array<{ phrase: string; count: number }>
  trigrams?: Array<{ phrase: string; count: number }>

  /** para numéricas (stars/scale/nps) */
  distribution?: Record<number, number>
  average?: number
  median?: number
  p25?: number
  p75?: number
  stddev?: number
  min?: number
  max?: number

  /** somente NPS */
  npsScore?: number
  promoters?: number
  passives?: number
  detractors?: number
}