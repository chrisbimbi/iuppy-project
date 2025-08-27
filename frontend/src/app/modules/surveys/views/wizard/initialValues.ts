// frontend/src/app/modules/surveys/views/wizard/initialValues.ts
import { CreateSurveyDto, SurveyStatus } from '@shared/types'

export const initialSurveyValues = (companyId: string, authorId: string): CreateSurveyDto => ({
    companyId,
    authorId,
    title: '',
    description: '',
    adminIds: [authorId],
    spaceIds: [],
    visibility: 'public',
    groupIds: [],
    notifyUsers: false,
    emailNotification: false,
    inAppNotification: false,
    pushNotification: false,
    pushTitle: '',
    pushContent: '',
    acknowledgementRequired: false,
    scheduleSurvey: false,
    expireSurvey: false,
    startsAt: '',
    endsAt: '',
    isAnonymous: false,
    status: SurveyStatus.Draft,
})
