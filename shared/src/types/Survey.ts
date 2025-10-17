// shared/src/types/Survey.ts
import { SurveyQuestion } from './SurveyQuestion'

/**
 * Status de uma pesquisa
 */
export enum SurveyStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived',
}

/**
 * Modelo principal de Survey
 * (espelha os campos operacionais de CreateSurveyDto)
 */
export interface Survey {
  id: string
  companyId: string
  title: string
  description?: string

  authorId: string
  adminIds: string[]

  spaceIds: string[]

  /**
   * Se visibility === 'specific_groups', groupIds deve conter 1+ IDs.
   * Caso contrário, o backend aceitará [].
   */
  visibility: 'public' | 'private' | 'specific_groups'
  groupIds?: string[]

  // Notificações / entrega
  notifyUsers: boolean
  emailNotification: boolean
  inAppNotification: boolean
  pushNotification: boolean
  pushTitle?: string
  pushContent?: string

  // Reconhecimento (li e aceito)
  acknowledgementRequired: boolean

  // Agendamento / expiração
  scheduleSurvey: boolean
  expireSurvey: boolean
  startsAt: Date | string
  endsAt: Date | string | null

  isAnonymous: boolean
  status: SurveyStatus

  questions: SurveyQuestion[]

  createdAt: Date | string
  updatedAt: Date | string
}
