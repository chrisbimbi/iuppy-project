import { useEffect, useState } from 'react'
import type { CompanyModule } from '@shared/types'
import { CompanyModulesService } from '../services/company-modules.service'

export function useCompanyModules(companyId?: string) {
    const [mods, setMods] = useState<CompanyModule[]>([])
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        if (!companyId) return
        setLoading(true)
        CompanyModulesService.list(companyId)
            .then(setMods)
            .finally(() => setLoading(false))
    }, [companyId])
    const enabled = (key: string) => !!mods.find(m => m.key === key && m.enabled)
    return { mods, enabled, loading, reload: () => companyId && CompanyModulesService.list(companyId).then(setMods) }
}