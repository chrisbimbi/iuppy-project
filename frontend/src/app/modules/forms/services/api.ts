// src/app/modules/forms/services/api.ts
import { api } from 'src/app/api';
import { saveAs } from 'file-saver'; // (npm install file-saver @types/file-saver)

// fonte única do companyId no CMS
function resolveCompanyId(): string | undefined {
  if (typeof window !== 'undefined') {
    const anyWin = window as any;
    if (anyWin.__COMPANY_ID__ && typeof anyWin.__COMPANY_ID__ === 'string') {
      return anyWin.__COMPANY_ID__;
    }
    try {
      const fromLs = window.localStorage.getItem('companyId');
      if (fromLs) return fromLs;
    } catch (_) { }
  }
  return undefined;
}

// Helper para adicionar companyId aos parâmetros (APENAS PARA ROTAS S1)
function withCompanyId(params: any = {}): any {
  const baseCompanyId = resolveCompanyId();
  return {
    ...params,
    ...(params.companyId ? {} : baseCompanyId ? { companyId: baseCompanyId } : {}),
  };
}

// Helper para download de BLOB (Excel)
const downloadBlob = (data: any, filename: string) => {
  const blob = new Blob([data], { type: data.type || 'application/octet-stream' });
  saveAs(blob, filename);
};

// ==================================
// NOVO (Fase 3): Tipo para Traduções
// ==================================
export type TranslatableString = {
  [locale: string]: string;
};

// ==================================
// ATUALIZADO (Fase 3): Payloads de DTO
// ==================================
interface FormFieldPayloadDto {
  type: string; // FormFieldType
  label: TranslatableString; // MODIFICADO
  required?: boolean;
  options?: Record<string, any> | null;
  order?: number;
}

interface CreateFormPayload {
  companyId: string;
  title: TranslatableString; // MODIFICADO
  description?: TranslatableString | null; // MODIFICADO
  status?: 'draft' | 'published' | 'archived';
  scheduleStartAt?: string | null;
  scheduleEndAt?: string | null;
  deadlineAt?: string | null;
  allowMultipleSubmissions?: boolean;
  anonymous?: boolean;
  allowExternal?: boolean;
  audienceSpaceIds?: string[];
  audienceGroupIds?: string[];
  attachmentsAllowed?: boolean;
  attachmentHelpText?: TranslatableString | null; // MODIFICADO
  remindersConfig?: Record<string, any> | null;
  notificationsConfig?: Record<string, any> | null;
  acl?: Record<string, any> | null;
  requiresApproval?: boolean;
  allowTranslations?: boolean;
  defaultLocale?: string | null;
  fields: FormFieldPayloadDto[];
}

interface UpdateFormPayload {
  title?: TranslatableString; // MODIFICADO
  description?: TranslatableString | null; // MODIFICADO
  status?: 'draft' | 'published' | 'archived';
  scheduleStartAt?: string | null;
  scheduleEndAt?: string | null;
  deadlineAt?: string | null;
  allowMultipleSubmissions?: boolean;
  anonymous?: boolean;
  allowExternal?: boolean;
  audienceSpaceIds?: string[];
  audienceGroupIds?: string[];
  attachmentsAllowed?: boolean;
  attachmentHelpText?: TranslatableString | null; // MODIFICADO
  remindersConfig?: Record<string, any> | null;
  notificationsConfig?: Record<string, any> | null;
  acl?: Record<string, any> | null;
  requiresApproval?: boolean;
  allowTranslations?: boolean;
  defaultLocale?: string | null;
  fields?: FormFieldPayloadDto[];
}

export const FormsApi = {
  // =============================================
  // S1: CRUD de formulários (Usam withCompanyId)
  // =============================================
  list: (params?: { status?: string; companyId?: string }) => {
    return api
      .get('/forms', { params: withCompanyId(params) })
      .then((r) => r.data);
  },

  get: (formId: string, companyId?: string) => {
    return api
      .get(`/forms/${formId}`, { params: withCompanyId({ companyId }) })
      .then((r) => r.data);
  },

  create: (payload: CreateFormPayload) => { // TIPO ATUALIZADO
    const baseCompanyId = resolveCompanyId();
    const body = baseCompanyId
      ? { ...payload, companyId: payload?.companyId ?? baseCompanyId }
      : payload;
    return api.post('/forms', body, { params: withCompanyId() }).then((r) => r.data);
  },

  update: (formId: string, payload: UpdateFormPayload) => { // TIPO ATUALIZADO
    return api
      .patch(`/forms/${formId}`, payload, { params: withCompanyId() })
      .then((r) => r.data);
  },

  publish: (formId: string) => {
    return api
      .post(`/forms/${formId}/publish`, null, { params: withCompanyId() })
      .then((r) => r.data);
  },

  unpublish: (formId: string) => {
    return api
      .post(`/forms/${formId}/unpublish`, null, { params: withCompanyId() })
      .then((r) => r.data);
  },

  duplicate: (formId: string) => {
    return api
      .post(`/forms/${formId}/duplicate`, null, { params: withCompanyId() })
      .then((r) => r.data);
  },

  removeMany: (ids: string[]) => {
    return api
      .post('/forms/remove-many', { ids }, { params: withCompanyId() })
      .then((r) => r.data);
  },

  // =============================================
  // S1: Segmentação e Submissões (Usam withCompanyId)
  // =============================================
  segmentationOptions: () => {
    return api.get('/forms/segments', { params: withCompanyId() }).then((r) => r.data);
  },

  getSubmissionDetail: (formId: string, submissionId: string) => {
    return api
      .get(`/forms/${formId}/submissions/${submissionId}`, {
        params: withCompanyId(),
      })
      .then((r) => r.data);
  },

  respond: (
    formId: string,
    submissionId: string,
    payload: { type: 'reply' | 'approve' | 'reject'; message?: string },
  ) => {
    return api
      .post(`/forms/${formId}/submissions/${submissionId}/respond`, payload, {
        params: withCompanyId(),
      })
      .then((r) => r.data);
  },

  // =============================================
  // 🔥 S3+: API de Chat (Usam S1)
  // =============================================
  getChatHistory: (formId: string, submissionId: string) => {
    return api
      .get(`/forms/${formId}/submissions/${submissionId}/chat`, {
        params: withCompanyId(),
      })
      .then((r) => r.data);
  },

  postChatMessage: (
    formId: string,
    submissionId: string,
    message: string,
  ) => {
    // O backend sabe que quem chama a API do CMS é 'rh'
    const payload = { message, actor: 'rh' };
    return api
      .post(`/forms/${formId}/submissions/${submissionId}/chat`, payload, {
        params: withCompanyId(),
      })
      .then((r) => r.data);
  },

  closeChat: (formId: string, submissionId: string) => {
    return api
      .post(`/forms/${formId}/submissions/${submissionId}/chat/close`, null, {
        params: withCompanyId(),
      })
      .then((r) => r.data);
  },

  // =============================================
  // S2: Analytics (NÃO USAM withCompanyId)
  // =============================================
  analyticsOverview: (params: any = {}) => {
    return api
      .get('/v2/forms/analytics/overview', { params })
      .then((r) => r.data);
  },

  analyticsList: (params: any = {}) => {
    return api
      .get('/v2/forms/analytics/list', { params })
      .then((r) => r.data);
  },

  analyticsStats: (formId: string, params: any = {}) => {
    return api
      .get(`/v2/forms/analytics/${formId}/stats`, { params })
      .then((r) => r.data);
  },

  analyticsSubmissions: (formId: string, params: any = {}) => {
    return api
      .get(`/v2/forms/analytics/${formId}/submissions`, {
        params,
      })
      .then((r) => r.data);
  },

  // 🔥 SPRINT 3: Novo endpoint
  analyticsFields: (formId: string, params: any = {}) => {
    return api
      .get(`/v2/forms/analytics/${formId}/fields`, { params })
      .then((r) => r.data);
  },

  // ==================================
  // NOVO (Fase 3 - Logs)
  // ==================================
  analyticsGetLogs: (formId: string, params: any = {}) => {
    // TODO: Você precisa criar este endpoint no backend (forms-analytics.controller.ts)
    // return api.get(`/v2/forms/analytics/${formId}/logs`, { params }).then((r) => r.data);

    // Simulação enquanto o backend não tem o endpoint de GET Log:
    console.warn("FormsApi.analyticsGetLogs: Endpoint não implementado, usando mock.");
    const mockLogs = [
      { id: '1', createdAt: new Date().toISOString(), actorUserId: 'user_rh_123', action: 'form_published', changes: { from: 'draft', to: 'published' } },
      { id: '2', createdAt: new Date(Date.now() - 100000).toISOString(), actorUserId: 'user_rh_123', action: 'form_created' },
      { id: '3', createdAt: new Date(Date.now() - 200000).toISOString(), actorUserId: 'user_rh_456', action: 'submission_approved', submissionId: 'sub_abc' },
    ];
    return Promise.resolve({ items: mockLogs, total: 3, page: 1, pageSize: 20 });
  },
  // ==================================

  // 🔥 GAP S2: Novo endpoint de backfill
  analyticsRunAggregation: (date: string, formId?: string) => {
    return api
      .post('/v2/forms/analytics/run-aggregation', { date, formId })
      .then((r) => r.data);
  },

  // 🔥 GAP S2: Novo endpoint de exportação
  analyticsExport: async (body: any = {}) => {
    const res = await api.post('/v2/forms/analytics/export', body, {
      responseType: 'blob',
    });

    // Extrai o nome do ficheiro do header (fallback para nome genérico)
    const disposition = res.headers['content-disposition'];
    let filename = `export-forms-${body.formId ?? 'all'}.xlsx`;
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }

    downloadBlob(res.data, filename);
    return res.data;
  },

  // =============================================
  // S2: Configurações de E-mail (Usa S1)
  // =============================================
  getFormNotificationSettings: (formId: string) => {
    return api
      .get(`/forms/${formId}/notification-settings`, { params: withCompanyId() })
      .then((r) => r.data);
  },

  saveFormNotificationSettings: (
    formId: string,
    items: Array<{ spaceId: string | null; emails: string[] }>,
  ) => {
    return api
      .post(
        `/forms/${formId}/notification-settings`,
        { items },
        { params: withCompanyId() },
      )
      .then((r) => r.data);
  },
};