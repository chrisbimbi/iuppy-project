// frontend/src/app/modules/company/providers/AccessProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from 'src/app/modules/auth'
import { AccessService } from '../services/access.service'
import type { AccessCapabilities, ScopeType } from '@shared/types/Access'
import type { ModuleKey, Role } from '@shared/types'

type Ctx = {
    loading: boolean
    caps: AccessCapabilities | null
    canView: (moduleKey: ModuleKey, spaceId?: string) => boolean
    canEdit: (moduleKey: ModuleKey, spaceId?: string) => boolean
    canManage: (moduleKey: ModuleKey, spaceId?: string) => boolean
    refetch: () => Promise<void>
}

const AccessCtx = createContext<Ctx>({
    loading: true,
    caps: null,
    canView: () => true,   // evita flicker
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
            // 401 → aplica fallback para super/company admin
            if (isOrgAdmin) {
                setCaps({
                    companyId,
                    userId: String(currentUser?.id ?? ''),
                    modules: {
                        surveys: {
                            canView: true,
                            canEdit: true,
                            canManage: true,
                            scopeType: 'ALL_SPACES' as ScopeType,
                        },
                    },
                })
            } else {
                // usuários não-admin: sem caps conhecidas
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

    const pick = (moduleKey: ModuleKey) => {
        return caps?.modules?.[moduleKey]
    }

    const canView = (moduleKey: ModuleKey, spaceId?: string) => {
        if (loading) return true // não pisca menu
        if (isOrgAdmin) return true
        const mod = pick(moduleKey)
        if (!mod) return false
        if (!mod.canView) return false

        if (mod.scopeType === 'ALL_SPACES') return true
        if (mod.scopeType === 'SPACE_IDS') {
            if (!spaceId) return false
            return !!mod.spaceIds?.includes(spaceId)
        }
        return false
    }

    const canEdit = (moduleKey: ModuleKey, spaceId?: string) => {
        if (loading) return false
        if (isOrgAdmin) return true
        const mod = pick(moduleKey)
        if (!mod || !mod.canEdit) return false
        if (mod.scopeType === 'ALL_SPACES') return true
        if (mod.scopeType === 'SPACE_IDS') {
            if (!spaceId) return false
            return !!mod.spaceIds?.includes(spaceId)
        }
        return false
    }

    const canManage = (moduleKey: ModuleKey, spaceId?: string) => {
        if (loading) return false
        if (isOrgAdmin) return true
        const mod = pick(moduleKey)
        if (!mod || !mod.canManage) return false
        if (mod.scopeType === 'ALL_SPACES') return true
        if (mod.scopeType === 'SPACE_IDS') {
            if (!spaceId) return false
            return !!mod.spaceIds?.includes(spaceId)
        }
        return false
    }

    const value = useMemo<Ctx>(() => ({
        loading,
        caps,
        canView,
        canEdit,
        canManage,
        refetch: fetchCaps,
    }), [loading, caps]) // can* são closures estáveis o bastante

    return <AccessCtx.Provider value={value}>{children}</AccessCtx.Provider>
}

export const useAccessCtx = () => useContext(AccessCtx)