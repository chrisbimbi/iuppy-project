import axios from 'axios'
import type { CompanyModule } from '@shared/types'

const API_BASE = (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:4000'

export const CompanyModulesService = {
    list(companyId: string) {
        return axios.get<CompanyModule[]>(`${API_BASE}/modules/${companyId}/company-modules`).then(r => r.data)
    },
    set(companyId: string, key: string, payload: { enabled: boolean; config?: Record<string, any> }) {
        return axios.patch<CompanyModule>(`${API_BASE}/modules/${companyId}/company-modules/${key}`, payload).then(r => r.data)
    }
}