import { CreateSurveyQuestionDto } from './CreateSurveyQuestionDto'

/**
 * Payload para atualização parcial de pergunta
 */
export type UpdateSurveyQuestionDto = Partial<CreateSurveyQuestionDto>