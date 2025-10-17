import { useMemo } from 'react'
import type { Locale } from '@shared/types'

export function resolveLocale(userLocale?: string, companyDefault: Locale = 'pt'): Locale {
    const lc = (userLocale || '').slice(0, 2).toLowerCase()
    const supported: Locale[] = ['pt', 'en', 'es', 'de']
    return (supported.includes(lc as any) ? lc : companyDefault) as Locale
}

export function useResolvedLocale(userLocale?: string, companyDefault?: Locale) {
    return useMemo(() => resolveLocale(userLocale, companyDefault), [userLocale, companyDefault])
}