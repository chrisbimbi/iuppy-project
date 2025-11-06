// frontend/src/app/modules/forms/services/api.ts
import { api } from 'src/app/api'

export const FormsApi = {
  // CRUD + list
  list: (params?: { status?: string }) =>
    api.get('/forms', { params }).then(r => r.data),

  get: (formId: string) => api.get(`/forms/${formId}`).then(r => r.data),

  create: (payload: any) => api.post('/forms', payload).then(r => r.data),

  update: (formId: string, payload: any) => api.patch(`/forms/${formId}`, payload).then(r => r.data),

  publish: (formId: string) => api.post(`/forms/${formId}/publish`).then(r => r.data),

  unpublish: (formId: string) => api.post(`/forms/${formId}/unpublish`).then(r => r.data),

  duplicate: (formId: string) => api.post(`/forms/${formId}/duplicate`).then(r => r.data),

  deleteMany: (ids: string[]) => api.delete('/forms', { data: { ids } }).then(r => r.data),

  segmentationOptions: () =>
    api.get('/forms/segmentation/options/all').then(r => r.data),

  // Inbox S1
  submissions: (formId: string, params: any) =>
    api.get(`/forms/${formId}/submissions`, { params }).then(r => r.data),

  respond: (formId: string, submissionId: string, payload: { type: 'reply'|'approve'|'reject'; message?: string }) =>
    api.post(`/forms/${formId}/submissions/${submissionId}/respond`, payload).then(r => r.data),

  // Analytics básicos (S1)
  analyticsList: (params: any) => api.get('/v2/forms/analytics/list', { params }).then(r => r.data),
  analyticsSubmissions: (formId: string, params: any) => api.get(`/v2/forms/analytics/${formId}/submissions`, { params }).then(r => r.data),
  exportCsv: (payload: any) => api.post('/v2/forms/analytics/export', payload, { responseType: 'blob' })
}