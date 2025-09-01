// shared/src/types/Access.ts
import { ModuleKey } from './ModuleKey'

export type ScopeType = 'ALL_SPACES' | 'SPACE_IDS'

export interface AccessGrant {
    id: string
    companyId: string
    userId: string
    moduleKey: ModuleKey
    scopeType: ScopeType
    spaceIds?: string[]
    canView: boolean
    canEdit: boolean
    canManage: boolean
    updatedAt: string | Date
}

export interface UpsertAccessGrantDto {
    userId: string
    moduleKey: ModuleKey
    scopeType: ScopeType
    spaceIds?: string[]
    canView: boolean
    canEdit: boolean
    canManage: boolean
}

export interface AccessCapabilities {
    companyId: string
    userId: string
    modules: {
        [K in ModuleKey]?: {
            canView: boolean
            canEdit: boolean
            canManage: boolean
            scopeType: ScopeType
            spaceIds?: string[]
        }
    }
}