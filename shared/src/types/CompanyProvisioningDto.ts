// shared/src/types/CompanyProvisioningDto.ts
import { CompanySettings } from './CompanySettings'
import { Locale } from './Locale'
import { ModuleKey } from './ModuleKey'
import { Role } from './Role'

export interface ProvisionUser {
    email: string
    displayName?: string
    roles: Role[]
}

export interface CompanyProvisioningDto {
    companyId: string
    name?: string

    // Settings iniciais
    defaultLocale?: Locale
    supportedLocales?: Locale[]
    branding?: CompanySettings['branding']

    // Módulos iniciais
    modules?: Array<{ key: ModuleKey; enabled: boolean; config?: Record<string, any> }>

    // Usuários iniciais (opcional)
    initialUsers?: ProvisionUser[]
}