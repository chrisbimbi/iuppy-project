import { Locale } from './Locale'

export interface CompanyBranding {
  logoUrl?: string
  appTitle?: string
  appSubtitle?: string

  primary?: string
  success?: string
  info?: string
  warning?: string
  danger?: string
  gray900?: string
  gray600?: string

  background?: string
  textOnBackground?: string
}

export interface CompanySettings {
  companyId: string
  defaultLocale: Locale
  supportedLocales: Locale[] // ex.: ['pt','en','es','de']
  branding: CompanyBranding
  updatedAt: string | Date
}