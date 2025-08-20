// frontend/src/app/modules/surveys/services/surveys.service.ts
import axios from 'axios'
import {
  Survey, SurveyResponse, SurveyStatisticsDto, QuestionStatisticsDto,
} from '@shared/types'

type Filters = { spaceId?: string; spaceIds?: string[]; includeGlobal?: boolean }

const API_BASE =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:4000'

function buildUrl(companyId: string, path: string, filters?: Filters) {
  const url = new URL(`${API_BASE}/modules/${companyId}${path}`)
  if (filters?.spaceId) url.searchParams.set('spaceId', filters.spaceId)
  if (filters?.spaceIds?.length) url.searchParams.set('spaceIds', filters.spaceIds.join(','))
  if (filters?.includeGlobal) url.searchParams.set('includeGlobal', 'true')
  return url.toString()
}

export const SurveyService = {
  list(companyId: string, filters?: Filters) {
    return axios.get<Survey[]>(buildUrl(companyId, '/surveys', filters)).then(r => r.data)
  },

  getOne(companyId: string, surveyId: string) {
    return axios.get<Survey>(`${API_BASE}/modules/${companyId}/surveys/${surveyId}`).then(r => r.data)
  },

  create(companyId: string, payload: Partial<Survey>) {
    return axios.post<Survey>(`${API_BASE}/modules/${companyId}/surveys`, payload).then(r => r.data)
  },

  update(companyId: string, surveyId: string, payload: Partial<Survey>) {
    return axios.patch<Survey>(`${API_BASE}/modules/${companyId}/surveys/${surveyId}`, payload).then(r => r.data)
  },

  remove(companyId: string, surveyId: string) {
    return axios.delete(`${API_BASE}/modules/${companyId}/surveys/${surveyId}`).then(() => { })
  },

  getResponses(companyId: string, surveyId: string) {
    return axios.get<SurveyResponse[]>(
      `${API_BASE}/modules/${companyId}/surveys/${surveyId}/responses`,
    ).then(r => r.data)
  },

  getSurveyStatistics(
    companyId: string,
    surveyId: string,
    opts?: { from?: string; to?: string; onlyIdentified?: boolean },
  ) {
    const url = new URL(`${API_BASE}/modules/${companyId}/surveys/${surveyId}/statistics`)
    if (opts?.from) url.searchParams.set('from', opts.from)
    if (opts?.to) url.searchParams.set('to', opts.to)
    if (opts?.onlyIdentified) url.searchParams.set('onlyIdentified', 'true')
    return axios.get<SurveyStatisticsDto>(url.toString()).then(r => r.data)
  },

  // opcional, mas útil:
  getQuestionStatistics(
    companyId: string,
    surveyId: string,
    questionId: string,
    opts?: { from?: string; to?: string; onlyIdentified?: boolean },
  ) {
    const url = new URL(`${API_BASE}/modules/${companyId}/surveys/${surveyId}/questions/${questionId}/statistics`)
    if (opts?.from) url.searchParams.set('from', opts.from)
    if (opts?.to) url.searchParams.set('to', opts.to)
    if (opts?.onlyIdentified) url.searchParams.set('onlyIdentified', 'true')
    return axios.get<QuestionStatisticsDto>(url.toString()).then(r => r.data)
  },
}