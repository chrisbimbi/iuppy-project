import { ModuleKey } from './ModuleKey'

export type ModuleAction = 'view' | 'edit'
export type GrantScope = 'all' | 'space'

export interface ModuleAccessGrant {
    id: string
    companyId: string
    userId: string
    moduleKey: ModuleKey
    scope: GrantScope
    spaceId?: string | null
    actions: ModuleAction[]
    updatedAt: string | Date
}

export type PerSpaceActions = Record<string, ModuleAction[]>

export interface UserModuleCapabilities {
    userId: string
    companyId: string
    modules: {
        [K in ModuleKey]?: {
            all?: ModuleAction[]
            perSpace?: PerSpaceActions
        }
    }
    updatedAt: string | Date
}