import { CompanySettings } from '@shared/types'

export class UpsertCompanySettingsDto implements Partial<CompanySettings> {
    defaultLocale?: any
    supportedLocales?: any[]
    branding?: CompanySettings['branding']
}