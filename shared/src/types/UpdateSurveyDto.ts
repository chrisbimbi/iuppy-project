import { CreateSurveyDto } from './CreateSurveyDto'

/**
 * Payload para atualização parcial de Survey
 */
export type UpdateSurveyDto = Partial<CreateSurveyDto>