// frontend/src/app/modules/surveys/services/surveys.service.ts
import { api } from '../../../api'
import {
  Survey,
  SurveyResponse,
  SurveyStatisticsDto,
  QuestionStatisticsDto,
  SurveyQuestion,
  CreateSurveyDto,
  UpdateSurveyDto,
  CreateSurveyQuestionDto,
  UpdateSurveyQuestionDto,
} from '@shared/types'

export type Filters = { spaceId?: string; spaceIds?: string[]; includeGlobal?: boolean; visibility?: string }

function pathWithFilters(path: string, filters?: Filters) {
  const u = new URL(path, 'http://_') // base fake só para montar query
  if (filters?.spaceId) u.searchParams.set('spaceId', filters.spaceId)
  if (filters?.spaceIds?.length) u.searchParams.set('spaceIds', filters.spaceIds.join(','))
  if (filters?.includeGlobal) u.searchParams.set('includeGlobal', 'true')
  if (filters?.visibility) u.searchParams.set('visibility', filters.visibility)
  return u.pathname + u.search
}

export const SurveyService = {
  /* ==================== SURVEYS ==================== */
  list(companyId: string, filters?: Filters) {
    return api
      .get<Survey[]>(pathWithFilters(`/modules/${companyId}/surveys`, filters))
      .then(r => r.data)
  },

  getOne(companyId: string, surveyId: string) {
    return api
      .get<Survey>(`/modules/${companyId}/surveys/${surveyId}`)
      .then(r => r.data)
  },

  create(companyId: string, payload: Partial<Survey>) {
    const body = { ...payload, companyId: payload.companyId ?? companyId }
    return api.post<Survey>(`/modules/${companyId}/surveys`, body).then(r => r.data)
  },

  update(companyId: string, surveyId: string, payload: UpdateSurveyDto | Partial<Survey>) {
    return api
      .patch<Survey>(`/modules/${companyId}/surveys/${surveyId}`, payload)
      .then(r => r.data)
  },

  remove(companyId: string, surveyId: string) {
    return api.delete<void>(`/modules/${companyId}/surveys/${surveyId}`).then(() => { })
  },

  /* =============== SURVEY RESPONSES & STATS =============== */
  getResponses(companyId: string, surveyId: string) {
    return api
      .get<SurveyResponse[]>(`/modules/${companyId}/surveys/${surveyId}/responses`)
      .then(r => r.data)
  },

  getSurveyStatistics(
    companyId: string,
    surveyId: string,
    opts?: { from?: string; to?: string; onlyIdentified?: boolean; tz?: string },
  ) {
    const path = new URL(`/modules/${companyId}/surveys/${surveyId}/statistics`, 'http://_')
    if (opts?.from) path.searchParams.set('from', opts.from)
    if (opts?.to) path.searchParams.set('to', opts.to)
    if (opts?.onlyIdentified) path.searchParams.set('onlyIdentified', 'true')
    const tz = opts?.tz || Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz) path.searchParams.set('tz', tz)
    return api.get<SurveyStatisticsDto>(path.pathname + path.search).then((r) => r.data)
  },

  getQuestionStatistics(
    companyId: string,
    surveyId: string,
    questionId: string,
    opts?: { from?: string; to?: string; onlyIdentified?: boolean; tz?: string },
  ) {
    const path = new URL(`/modules/${companyId}/surveys/${surveyId}/questions/${questionId}/statistics`, 'http://_')
    if (opts?.from) path.searchParams.set('from', opts.from)
    if (opts?.to) path.searchParams.set('to', opts.to)
    if (opts?.onlyIdentified) path.searchParams.set('onlyIdentified', 'true')
    const tz = opts?.tz || Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz) path.searchParams.set('tz', tz)
    return api.get<QuestionStatisticsDto>(path.pathname + path.search).then((r) => r.data)
  },

  /* ==================== QUESTIONS ==================== */
  addQuestion(companyId: string, surveyId: string, payload: CreateSurveyQuestionDto) {
    return api
      .post<SurveyQuestion>(`/modules/${companyId}/surveys/${surveyId}/questions`, payload)
      .then(r => r.data)
  },

  updateQuestion(companyId: string, questionId: string, payload: UpdateSurveyQuestionDto) {
    // rota focada na questão (não precisa de surveyId)
    return api
      .patch<SurveyQuestion>(`/modules/${companyId}/surveys/questions/${questionId}`, payload)
      .then(r => r.data)
  },

  removeQuestion(companyId: string, questionId: string) {
    return api
      .delete<void>(`/modules/${companyId}/surveys/questions/${questionId}`)
      .then(() => { })
  },

  reorderQuestions(
    companyId: string,
    surveyId: string,
    items: Array<{ id: string; order: number }>,
  ) {
    // backend pode aceitar array puro; se preferir {items}, troque aqui.
    return api
      .patch<void>(`/modules/${companyId}/surveys/${surveyId}/questions/reorder`, items)
      .then(() => { })
  },
}