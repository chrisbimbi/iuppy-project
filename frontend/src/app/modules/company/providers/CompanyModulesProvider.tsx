// frontend/src/app/modules/company/providers/CompanyModulesProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from 'src/app/modules/auth'
import { CompanyModulesService } from '../services/companyModules.service'
import { CompanyModule, ModuleKey } from '@shared/types'

type Ctx = {
    loading: boolean
    modules: CompanyModule[]
    isEnabled: (key: ModuleKey) => boolean
    refetch: () => Promise<void>
}

const CtxDefault: Ctx = {
    loading: true,
    modules: [],
    isEnabled: () => false,
    refetch: async () => { },
}

const CompanyModulesCtx = createContext<Ctx>(CtxDefault)

export const CompanyModulesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth()
    const companyId = currentUser?.companyId
    const [loading, setLoading] = useState(true)
    const [modules, setModules] = useState<CompanyModule[]>([])

    const fetchModules = async () => {
        if (!companyId) return
        setLoading(true)
        try {
            const list = await CompanyModulesService.list(companyId)
            setModules(list || [])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchModules()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId])

    const isEnabled = useMemo(() => {
        const map = new Map<ModuleKey, boolean>()
        modules.forEach((m) => map.set(m.key, !!m.enabled))
        return (key: ModuleKey) => map.get(key) === true
    }, [modules])

    return (
        <CompanyModulesCtx.Provider value={{ loading, modules, isEnabled, refetch: fetchModules }}>
            {children}
        </CompanyModulesCtx.Provider>
    )
}

export const useCompanyModulesCtx = () => useContext(CompanyModulesCtx)