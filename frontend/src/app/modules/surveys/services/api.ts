import { api } from '../../../api'
import {
    Survey, SurveyResponse, SurveyStatisticsDto, QuestionStatisticsDto,
} from '@shared/types'

type Filters = { spaceId?: string; spaceIds?: string[]; includeGlobal?: boolean }

function withFilters(url: string, filters?: Filters) {
    const u = new URL(url, window.location.origin)
    if (filters?.spaceId) u.searchParams.set('spaceId', filters.spaceId)
    if (filters?.spaceIds?.length) u.searchParams.set('spaceIds', filters.spaceIds.join(','))
    if (filters?.includeGlobal) u.searchParams.set('includeGlobal', 'true')
    // devolvemos apenas o path+query (porque api já tem baseURL)
    return u.pathname + u.search
}

export const SurveyApi = {
    list(companyId: string, filters?: Filters) {
        return api.get<Survey[]>(withFilters(`/modules/${companyId}/surveys`, filters)).then(r => r.data)
    },

    getOne(companyId: string, surveyId: string) {
        return api.get<Survey>(`/modules/${companyId}/surveys/${surveyId}`).then(r => r.data)
    },

    // payload NÃO precisa conter authorId/companyId; backend seta pelo token/rota
    create(companyId: string, payload: Partial<Survey>) {
        return api.post<Survey>(`/modules/${companyId}/surveys`, payload).then(r => r.data)
    },

    update(companyId: string, surveyId: string, payload: Partial<Survey>) {
        return api.patch<Survey>(`/modules/${companyId}/surveys/${surveyId}`, payload).then(r => r.data)
    },

    remove(companyId: string, surveyId: string) {
        return api.delete<void>(`/modules/${companyId}/surveys/${surveyId}`).then(() => { })
    },

    getResponses(companyId: string, surveyId: string) {
        return api.get<SurveyResponse[]>(`/modules/${companyId}/surveys/${surveyId}/responses`).then(r => r.data)
    },

    getSurveyStatistics(companyId: string, surveyId: string, opts?: { from?: string; to?: string; onlyIdentified?: boolean }) {
        const u = new URL(`/modules/${companyId}/surveys/${surveyId}/statistics`, window.location.origin)
        if (opts?.from) u.searchParams.set('from', opts.from)
        if (opts?.to) u.searchParams.set('to', opts.to)
        if (opts?.onlyIdentified) u.searchParams.set('onlyIdentified', 'true')
        return api.get<SurveyStatisticsDto>(u.pathname + u.search).then(r => r.data)
    },

    getQuestionStatistics(companyId: string, surveyId: string, questionId: string, opts?: { from?: string; to?: string; onlyIdentified?: boolean }) {
        const u = new URL(`/modules/${companyId}/surveys/${surveyId}/questions/${questionId}/statistics`, window.location.origin)
        if (opts?.from) u.searchParams.set('from', opts.from)
        if (opts?.to) u.searchParams.set('to', opts.to)
        if (opts?.onlyIdentified) u.searchParams.set('onlyIdentified', 'true')
        return api.get<QuestionStatisticsDto>(u.pathname + u.search).then(r => r.data)
    },
}