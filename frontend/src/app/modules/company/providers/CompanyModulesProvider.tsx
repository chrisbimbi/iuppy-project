import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { CompanyModule, ModuleKey } from '@shared/types'
import { CompanyModulesService } from '../../company/services/companyModules.service'
import { useAuth } from '../../auth'

type CtxValue = {
    modules: CompanyModule[] | null
    loading: boolean
    isEnabled: (key: ModuleKey) => boolean
    refresh: () => Promise<void>
}

const Ctx = createContext<CtxValue | undefined>(undefined)

export const CompanyModulesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth()
    const companyId = currentUser?.companyId
    const [modules, setModules] = useState<CompanyModule[] | null>(null)
    const [loading, setLoading] = useState(false)

    const load = async () => {
        if (!companyId) return
        setLoading(true)
        try {
            const list = await CompanyModulesService.list(companyId)
            setModules(list)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [companyId])

    const value = useMemo<CtxValue>(() => ({
        modules,
        loading,
        isEnabled: (key: ModuleKey) => !!modules?.find(m => m.key === key)?.enabled,
        refresh: load,
    }), [modules, loading])

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useCompanyModulesCtx = () => {
    const ctx = useContext(Ctx)
    if (!ctx) throw new Error('useCompanyModulesCtx must be used within CompanyModulesProvider')
    return ctx
}