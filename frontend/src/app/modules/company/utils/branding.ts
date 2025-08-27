// src/app/modules/company/utils/branding.ts
import { CompanySettings } from '@shared/types'

type Branding = CompanySettings['branding']

const VARS_MAP: Record<keyof NonNullable<Branding>, string> = {
    logoUrl: '--brand-logo-url',
    primary: '--brand-primary',
    success: '--brand-success',
    info: '--brand-info',
    warning: '--brand-warning',
    danger: '--brand-danger',
    gray900: '--brand-gray-900',
    gray600: '--brand-gray-600',
    appTitle: '',
    appSubtitle: '',
    background: '',
    textOnBackground: ''
}

/** Aplica cores/branding no :root como CSS variables */
export function applyBrandingToDocument(branding?: Branding) {
    const root = document.documentElement
    if (!branding) return

    Object.entries(VARS_MAP).forEach(([k, cssVar]) => {
        const val = (branding as any)[k]
        if (val) root.style.setProperty(cssVar, val)
    })
}

/** Remove variáveis previamente aplicadas (opcional) */
export function clearBrandingFromDocument() {
    const root = document.documentElement
    Object.values(VARS_MAP).forEach(cssVar => root.style.removeProperty(cssVar))
}