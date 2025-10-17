import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from 'src/app/modules/auth'
import { AccessService } from '../services/access.service'
import type { AccessCapabilities, ScopeType } from '@shared/types/Access'
import type { ModuleKey, Role } from '@shared/types'

type Action = 'view' | 'edit' | 'manage'

type Ctx = {
    loading: boolean
    caps: AccessCapabilities | null
    can: (action: Action, moduleKey: ModuleKey, spaceId?: string) => boolean
    // legados úteis se já usados em algum ponto do app
    canView: (moduleKey: ModuleKey, spaceId?: string) => boolean
    canEdit: (moduleKey: ModuleKey, spaceId?: string) => boolean
    canManage: (moduleKey: ModuleKey, spaceId?: string) => boolean
    refetch: () => Promise<void>
}

const AccessCtx = createContext<Ctx>({
    loading: true,
    caps: null,
    can: () => false,
    canView: () => true, // evita flicker inicial
    canEdit: () => false,
    canManage: () => false,
    refetch: async () => { },
})

export const AccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth()
    const companyId = currentUser?.companyId ?? ''
    const role = (currentUser?.role as Role | undefined) ?? 'viewer'

    const [caps, setCaps] = useState<AccessCapabilities | null>(null)
    const [loading, setLoading] = useState<boolean>(true)

    const isOrgAdmin = role === 'super_admin' || role === 'company_admin'

    const fetchCaps = async () => {
        if (!companyId) return
        setLoading(true)
        try {
            const data = await AccessService.capabilities(companyId)
            setCaps(data)
        } catch (err: any) {
            // Fallback defensivo p/ org admins
            if (isOrgAdmin) {
                setCaps({
                    companyId,
                    userId: String(currentUser?.id ?? ''),
                    modules: {}, // admin org é tratado em can()
                })
            } else {
                setCaps(null)
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCaps()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId])

    const pick = (moduleKey: ModuleKey) => caps?.modules?.[moduleKey]

    // normaliza hierarquia: manage ⊇ edit ⊇ view
    const can = (action: Action, moduleKey: ModuleKey, spaceId?: string): boolean => {
        if (loading) return action === 'view' // não "piscar" a UI de leitura
        if (isOrgAdmin) return true

        const mod = pick(moduleKey)
        if (!mod) return false

        const hasView = !!mod.canView
        const hasEdit = !!mod.canEdit || !!mod.canManage
        const hasManage = !!mod.canManage

        const scope: ScopeType | undefined = (mod as any).scopeType
        const ids: string[] = (mod as any).spaceIds || []

        const checkScope = () => {
            if (!hasView && !hasEdit && !hasManage) return false
            if (scope === 'ALL_SPACES') return true
            if (scope === 'SPACE_IDS') {
                if (!spaceId) return false
                return ids.includes(spaceId)
            }
            // se estrutura vier de um agregador por espaço, trate como negativo
            return false
        }

        if (action === 'view') return hasView && checkScope()
        if (action === 'edit') return hasEdit && checkScope()
        return hasManage && checkScope()
    }

    const canView = (m: ModuleKey, s?: string) => can('view', m, s)
    const canEdit = (m: ModuleKey, s?: string) => can('edit', m, s)
    const canManage = (m: ModuleKey, s?: string) => can('manage', m, s)

    const value = useMemo<Ctx>(() => ({
        loading,
        caps,
        can,
        canView,
        canEdit,
        canManage,
        refetch: fetchCaps,
    }), [loading, caps]) // closures estáveis

    return <AccessCtx.Provider value={value}>{children}</AccessCtx.Provider>
}

export const useAccess = () => useContext(AccessCtx)