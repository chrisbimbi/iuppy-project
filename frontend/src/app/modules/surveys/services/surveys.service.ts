import axios from 'axios'
import { Survey, SurveyResponse } from '@shared/types'

type Filters = {
  spaceId?: string
  spaceIds?: string[]
  includeGlobal?: boolean
}

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
  async list(companyId: string, filters?: Filters): Promise<Survey[]> {
    const { data } = await axios.get<Survey[]>(
      buildUrl(companyId, '/surveys', filters)
    )
    return data
  },

  async create(companyId: string, payload: Partial<Survey>): Promise<Survey> {
    const { data } = await axios.post<Survey>(
      `${API_BASE}/modules/${companyId}/surveys`,
      payload
    )
    return data
  },

  async update(companyId: string, surveyId: string, payload: Partial<Survey>): Promise<Survey> {
    const { data } = await axios.patch<Survey>(
      `${API_BASE}/modules/${companyId}/surveys/${surveyId}`,
      payload
    )
    return data
  },

  async remove(companyId: string, surveyId: string): Promise<void> {
    await axios.delete(`${API_BASE}/modules/${companyId}/surveys/${surveyId}`)
  },

  async getResponses(companyId: string, surveyId: string): Promise<SurveyResponse[]> {
    const { data } = await axios.get<SurveyResponse[]>(
      `${API_BASE}/modules/${companyId}/surveys/${surveyId}/responses`
    )
    return data
  },
}