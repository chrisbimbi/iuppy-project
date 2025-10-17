// frontend/src/services/company-settings.service.ts
import { api } from 'src/app/api'
import type { CompanySettings } from '@shared/types'

export const CompanySettingsService = {
    get(companyId: string) {
        return api
            .get<CompanySettings>(`/modules/${companyId}/company-settings`)
            .then(r => r.data)
    },
    update(companyId: string, payload: Partial<CompanySettings>) {
        return api
            .patch<CompanySettings>(`/modules/${companyId}/company-settings`, payload)
            .then(r => r.data)
    },
}