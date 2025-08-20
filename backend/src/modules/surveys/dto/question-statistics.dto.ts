export type QuestionTypeDto = 'text' | 'single' | 'multi' | 'stars' | 'scale' | 'nps'

export class QuestionStatisticsDto {
  questionId!: string
  questionText?: string
  type?: QuestionTypeDto

  totalRespondents!: number
  answeredCount?: number
  skippedCount?: number

  /** para perguntas com opções (single, multi) */
  options?: Record<string, number>
  optionsPct?: Record<string, string> // ex.: "34.5%"

  /** para perguntas abertas (text) */
  answers?: string[]
  topWords?: Array<{ word: string; count: number }>
  /** novos */
  bigrams?: Array<{ phrase: string; count: number }>
  trigrams?: Array<{ phrase: string; count: number }>

  /** para perguntas numéricas (stars, scale, nps): contagem por valor */
  distribution?: Record<number, number>

  /** para perguntas numéricas (stars, scale): estatísticas */
  average?: number
  median?: number
  p25?: number
  p75?: number
  stddev?: number
  min?: number
  max?: number

  /** somente para NPS */
  npsScore?: number
  promoters?: number
  passives?: number
  detractors?: number
}