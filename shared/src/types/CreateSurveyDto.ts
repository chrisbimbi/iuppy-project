import { SurveyStatus } from './Survey'

/**
 * Payload para criação de uma Survey
 */
export interface CreateSurveyDto {
    companyId: string,
    title: string
    description?: string
    authorId: string
    adminIds: string[]
    spaceIds: string[]
    visibility: 'public' | 'private' | 'specific_groups';
    notifyUsers: boolean;                   // email interno
    pushNotification: boolean;
    pushContent?: string;
    pushTitle?: string;
    acknowledgementRequired: boolean;
    emailNotification: boolean;
    inAppNotification: boolean;
    groupIds: string[]
    isAnonymous: boolean
    scheduleSurvey: boolean
    expireSurvey: boolean
    startsAt: Date | string
    endsAt: Date | string
    status?: SurveyStatus
    createdAt?: string; // Adicionado caso o backend envie a data de criação
    updatedAt?: string; // Adicionado caso o backend envie a data de atualização

}