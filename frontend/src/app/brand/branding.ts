import type { CompanySettings } from '@shared/types'

export function applyBranding(settings?: CompanySettings) {
    if (!settings) return
    const root = document.documentElement
    const b = settings.branding || {}
    const set = (k: string, v?: string) => v && root.style.setProperty(k, v)

    set('--bs-primary', b.primary)
    set('--bs-success', b.success)
    set('--bs-info', b.info)
    set('--bs-warning', b.warning)
    set('--bs-danger', b.danger)
    set('--bs-gray-900', b.gray900)
    set('--bs-gray-600', b.gray600)

    // opcional: trocar logo em um lugar central
    const logoEl = document.getElementById('app_company_logo') as HTMLImageElement | null
    if (logoEl && b.logoUrl) logoEl.src = b.logoUrl
}