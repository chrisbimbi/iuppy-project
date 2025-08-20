import { Injectable } from '@nestjs/common'
import { CompanySettingsService } from 'src/modules/company-settings/company-settings.service'
import { CompanyModulesService } from 'src/modules/company-modules/company-modules.service'
import { CompanyProvisioningDto, ModuleKey, Role } from '@shared/types'

// NOTE: user/identity service depende do que vocês usam. Aqui, stub simples.
@Injectable()
export class CompaniesService {
    constructor(
        private settings: CompanySettingsService,
        private modules: CompanyModulesService,
    ) { }

    async provision(dto: CompanyProvisioningDto) {
        const companyId = dto.companyId

        // 1) Settings
        await this.settings.upsert(companyId, {
            defaultLocale: dto.defaultLocale || 'pt',
            supportedLocales: dto.supportedLocales?.length ? dto.supportedLocales : ['pt', 'en', 'es', 'de'],
            branding: dto.branding || {},
        })

        // 2) Modules
        const defaults: Array<{ key: ModuleKey; enabled: boolean }> = [
            { key: 'news', enabled: true },
            { key: 'channels', enabled: true },
            { key: 'groups', enabled: true },
            { key: 'surveys', enabled: true },
        ]
        const mods = dto.modules?.length ? dto.modules : defaults
        for (const m of mods) {
            await this.modules.upsert(companyId, m.key, m.enabled, m.config)
        }

        // 3) Users iniciais (stub: apenas retorna; integre com seu user service/SSO)
        const initialUsers = (dto.initialUsers || []).map(u => ({
            email: u.email, displayName: u.displayName, roles: u.roles,
        }))

        return { companyId, modules: mods, initialUsers }
    }
}