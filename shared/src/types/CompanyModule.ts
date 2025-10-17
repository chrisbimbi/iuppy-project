// shared/src/types/CompanyModule.ts
import { ModuleKey } from './ModuleKey'

export interface CompanyModule {
    companyId: string
    key: ModuleKey
    enabled: boolean
    config?: Record<string, any> | null
    updatedAt: string | Date
}