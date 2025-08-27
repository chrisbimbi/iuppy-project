// src/app/modules/company/services/companyModules.service.ts
import { api } from 'src/app/modules/auth/core/_requests'
import { CompanyModule, ModuleKey } from '@shared/types'

export const CompanyModulesService = {
    async list(companyId: string): Promise<CompanyModule[]> {
        const { data } = await api.get(`/modules/${companyId}/company-modules`)
        return data
    },

    async upsert(companyId: string, key: ModuleKey, enabled: boolean, config?: Record<string, any>): Promise<CompanyModule> {
        const { data } = await api.patch(`/modules/${companyId}/company-modules/${key}`, { enabled, config })
        return data
    },
}