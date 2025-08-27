// src/app/modules/company/services/companySettings.service.ts
import { api } from 'src/app/modules/auth/core/_requests'
import { CompanySettings } from '@shared/types'

export const CompanySettingsService = {
    async get(companyId: string): Promise<CompanySettings> {
        const { data } = await api.get(`/modules/${companyId}/company-settings`)
        return data
    },

    async upsert(companyId: string, payload: Partial<CompanySettings>): Promise<CompanySettings> {
        // O backend espera { defaultLocale?, supportedLocales?, branding? }
        // Mapeamos apenas o que interessa
        const body: any = {}
        if (payload.defaultLocale) body.defaultLocale = payload.defaultLocale
        if (payload.supportedLocales) body.supportedLocales = payload.supportedLocales
        if (payload.branding) body.branding = payload.branding

        const { data } = await api.patch(`/modules/${companyId}/company-settings`, body)
        return data
    },
}