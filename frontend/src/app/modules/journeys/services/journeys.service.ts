import { api } from '../../auth/core/_requests'
import { Journey } from '../types'

const API_URL = '/journeys'

export const getJourney = (id: string): Promise<Journey> => {
    return api.get(`${API_URL}/${id}`).then((d) => d.data)
}

export const updateJourney = (id: string, data: Partial<Journey>): Promise<Journey> => {
    return api.put(`${API_URL}/${id}`, data).then((d) => d.data)
}

export const createJourney = (data: Partial<Journey>): Promise<Journey> => {
    return api.post(`${API_URL}`, data).then((d) => d.data)
}

export const getJourneys = (): Promise<Journey[]> => {
    return api.get(`${API_URL}`).then((d) => d.data)
}

export const deleteJourney = (id: string): Promise<void> => {
    return api.delete(`${API_URL}/${id}`).then((d) => d.data)
}

export const duplicateJourney = (id: string): Promise<Journey> => {
    return api.post(`${API_URL}/${id}/duplicate`, {}).then((d) => d.data)
}

export const getJourneyStats = (id: string): Promise<any> => {
    return api.get(`${API_URL}/${id}/stats`).then((d) => d.data)
}

export function getStepStats(id: string) {
    return api.get(`${API_URL}/${id}/steps-stats`).then(res => res.data)
}

export function getStepAnalytics(journeyId: string, stepId: string) {
    return api.get(`${API_URL}/${journeyId}/steps/${stepId}/analytics`).then(res => res.data)
}

export function getStepSubmissions(journeyId: string, stepId: string) {
    return api.get(`${API_URL}/${journeyId}/steps/${stepId}/submissions`).then(res => res.data)
}

export function getStepAnalyticsStats(journeyId: string, stepId: string) {
    return api.get(`${API_URL}/${journeyId}/steps/${stepId}/stats`).then(res => res.data)
}

export function getStepAnalyticsFields(journeyId: string, stepId: string) {
    return api.get(`${API_URL}/${journeyId}/steps/${stepId}/fields`).then(res => res.data)
}

export function exportStepSubmissions(journeyId: string, stepId: string) {
    return api.post(`${API_URL}/${journeyId}/steps/${stepId}/export`, {}, { responseType: 'blob' }).then(res => res.data)
}

export function downloadStepAttachments(journeyId: string, stepId: string) {
    return api.post(`${API_URL}/${journeyId}/steps/${stepId}/attachments/download`, {}, { responseType: 'blob' }).then(res => res.data)
}

export function getUserProgress(id: string) {
    return api.get(`${API_URL}/${id}/users-progress`).then(res => res.data)
}

export const getGeneralStats = (): Promise<any> => {
    return api.get(`${API_URL}/stats/general`).then((d) => d.data)
}
