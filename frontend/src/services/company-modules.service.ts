// frontend/src/services/company-modules.service.ts
import { api } from 'src/app/api'
import type { CompanyModule } from '@shared/types'

export const CompanyModulesService = {
  list(companyId: string) {
    return api.get<CompanyModule[]>(`/modules/${companyId}/company-modules`).then(r => r.data)
  },
  set(companyId: string, key: string, payload: { enabled: boolean; config?: Record<string, any> }) {
    return api.patch<CompanyModule>(`/modules/${companyId}/company-modules/${key}`, payload).then(r => r.data)
  },
}