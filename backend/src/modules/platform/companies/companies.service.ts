import { Injectable } from '@nestjs/common'
import { CompanySettingsService } from 'src/modules/company-settings/company-settings.service'
import { CompanyModulesService } from 'src/modules/company-modules/company-modules.service'
import { CompanyProvisioningDto, ModuleKey } from '@shared/types'

type ModInput = { key: ModuleKey; enabled: boolean; config?: Record<string, any> }

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
            supportedLocales: dto.supportedLocales?.length
                ? dto.supportedLocales
                : ['pt', 'en', 'es', 'de'],
            branding: dto.branding || {},
        })

        // 2) Modules
        const defaults: ModInput[] = [
            { key: 'news', enabled: true },
            { key: 'channels', enabled: true },
            { key: 'groups', enabled: true },
            { key: 'surveys', enabled: true },
        ]
        const mods: ModInput[] = dto.modules?.length ? dto.modules : defaults

        for (const m of mods) {
            await this.modules.upsert(companyId, m.key, m.enabled, m.config ?? {})
        }

        // 3) Users iniciais (stub – integre com seu user/SSO)
        const initialUsers = (dto.initialUsers || []).map(u => ({
            email: u.email,
            displayName: u.displayName,
            roles: u.roles,
        }))

        return { companyId, modules: mods, initialUsers }
    }
}