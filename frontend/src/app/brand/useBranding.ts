import { useEffect } from 'react'
import axios from 'axios'
import { applyBranding } from './branding'
import type { CompanySettings } from '@shared/types'

export function useBranding(companyId?: string, apiBase?: string) {
    useEffect(() => {
        if (!companyId) return
        const base = apiBase || (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '')
        axios.get<CompanySettings>(`${base}/modules/${companyId}/company-settings`)
            .then(r => applyBranding(r.data))
            .catch(() => { })
    }, [companyId, apiBase])
}