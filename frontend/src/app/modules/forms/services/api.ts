// src/modules/forms/services/api.ts
import { api } from 'src/app/api'

// fonte única do companyId no CMS
function resolveCompanyId(): string | undefined {
  // 1) se a página injetar isso no window
  if (typeof window !== 'undefined') {
    const anyWin = window as any
    if (anyWin.__COMPANY_ID__ && typeof anyWin.__COMPANY_ID__ === 'string') {
      return anyWin.__COMPANY_ID__
    }
    // 2) se tiver salvo no localStorage (muito comum no CMS)
    try {
      const fromLs = window.localStorage.getItem('companyId')
      if (fromLs) return fromLs
    } catch (_) {
      // ignore
    }
  }
  return undefined
}

export const FormsApi = {
  // CRUD de formulários
  list: (params?: { status?: string; companyId?: string }) => {
    const baseCompanyId = resolveCompanyId()
    const finalParams = {
      ...(params || {}),
      // se o caller não passou companyId, a gente coloca
      ...(params?.companyId ? {} : baseCompanyId ? { companyId: baseCompanyId } : {}),
    }

    return api.get('/forms', { params: finalParams }).then((r) => r.data)
  },

  get: (formId: string, companyId?: string) => {
    const baseCompanyId = companyId || resolveCompanyId()
    const params = baseCompanyId ? { companyId: baseCompanyId } : undefined
    return api.get(`/forms/${formId}`, { params }).then((r) => r.data)
  },

  create: (payload: any) => {
    // aqui é bom garantir que o payload tenha companyId
    const baseCompanyId = resolveCompanyId()
    const body = baseCompanyId
      ? { ...payload, companyId: payload?.companyId ?? baseCompanyId }
      : payload

    return api.post('/forms', body).then((r) => r.data)
  },

  update: (formId: string, payload: any) => {
    const baseCompanyId = resolveCompanyId()
    const params = baseCompanyId ? { companyId: baseCompanyId } : undefined
    return api.patch(`/forms/${formId}`, payload, { params }).then((r) => r.data)
  },

  publish: (formId: string) => {
    const baseCompanyId = resolveCompanyId()
    const params = baseCompanyId ? { companyId: baseCompanyId } : undefined
    return api.post(`/forms/${formId}/publish`, null, { params }).then((r) => r.data)
  },

  unpublish: (formId: string) => {
    const baseCompanyId = resolveCompanyId()
    const params = baseCompanyId ? { companyId: baseCompanyId } : undefined
    return api.post(`/forms/${formId}/unpublish`, null, { params }).then((r) => r.data)
  },

  duplicate: (formId: string) => {
    const baseCompanyId = resolveCompanyId()
    const params = baseCompanyId ? { companyId: baseCompanyId } : undefined
    return api.post(`/forms/${formId}/duplicate`, null, { params }).then((r) => r.data)
  },

  removeMany: (ids: string[]) => {
    const baseCompanyId = resolveCompanyId()
    const params = baseCompanyId ? { companyId: baseCompanyId } : undefined
    return api.post('/forms/remove-many', { ids }, { params }).then((r) => r.data)
  },

  // segmentação
  segmentationOptions: () => {
    const baseCompanyId = resolveCompanyId()
    const params = baseCompanyId ? { companyId: baseCompanyId } : undefined
    return api.get('/forms/segments', { params }).then((r) => r.data)
  },

  // submissões (CMS)
  submissions: (formId: string, params: any = {}) => {
    const baseCompanyId = resolveCompanyId()
    const finalParams = {
      ...params,
      ...(params.companyId ? {} : baseCompanyId ? { companyId: baseCompanyId } : {}),
    }
    return api.get(`/forms/${formId}/submissions`, { params: finalParams }).then((r) => r.data)
  },

  respond: (
    formId: string,
    submissionId: string,
    payload: { type: 'reply' | 'approve' | 'reject'; message?: string },
  ) => {
    const baseCompanyId = resolveCompanyId()
    const params = baseCompanyId ? { companyId: baseCompanyId } : undefined
    return api
      .post(`/forms/${formId}/submissions/${submissionId}/respond`, payload, { params })
      .then((r) => r.data)
  },

  // NOVO: analytics — casando com o que tem no backend (/v2/forms/analytics/...)
  analyticsOverview: (params: { from?: string; to?: string; timezone?: string } = {}) => {
    const baseCompanyId = resolveCompanyId()
    const finalParams = {
      ...params,
      ...(baseCompanyId ? { companyId: baseCompanyId } : {}),
    }
    return api.get('/v2/forms/analytics/overview', { params: finalParams }).then((r) => r.data)
  },

  analyticsStats: (formId: string, params: any = {}) => {
    const baseCompanyId = resolveCompanyId()
    const finalParams = {
      ...params,
      ...(baseCompanyId ? { companyId: baseCompanyId } : {}),
    }
    return api
      .get(`/v2/forms/analytics/${formId}/stats`, { params: finalParams })
      .then((r) => r.data)
  },

  // NOVO: e-mails por formulário
  getFormNotificationSettings: (formId: string) => {
    const baseCompanyId = resolveCompanyId()
    const params = baseCompanyId ? { companyId: baseCompanyId } : undefined
    return api.get(`/forms/${formId}/notification-settings`, { params }).then((r) => r.data)
  },

  saveFormNotificationSettings: (
    formId: string,
    items: Array<{ spaceId: string | null; emails: string[] }>,
  ) => {
    const baseCompanyId = resolveCompanyId()
    const params = baseCompanyId ? { companyId: baseCompanyId } : undefined
    return api
      .post(
        `/forms/${formId}/notification-settings`,
        {
          // se alguém mandar itens vazios daqui, o backend vai receber mesmo assim,
          // a filtragem de vazio vamos fazer no modal pra evitar o erro do índice único
          items,
        },
        { params },
      )
      .then((r) => r.data)
  },
}