import axios from 'axios'
import type { CompanySettings } from '@shared/types'

const API_BASE = (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:4000'

export const CompanySettingsService = {
    get(companyId: string) {
        return axios.get<CompanySettings>(`${API_BASE}/modules/${companyId}/company-settings`).then(r => r.data)
    },
    update(companyId: string, payload: Partial<CompanySettings>) {
        return axios.patch<CompanySettings>(`${API_BASE}/modules/${companyId}/company-settings`, payload).then(r => r.data)
    }
}