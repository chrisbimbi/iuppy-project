import React from 'react'
import { useAccess } from '../providers/AccessProvider'
import type { ModuleKey } from '@shared/types'

type Action = 'view' | 'edit' | 'manage'

export const WithCapability: React.FC<{
    action: Action
    moduleKey: ModuleKey
    spaceId?: string
    as?: 'show' | 'disable'
    reason?: string
    children: (enabled: boolean) => React.ReactNode
}> = ({ action, moduleKey, spaceId, as = 'disable', reason = 'Sem permissão', children }) => {
    const { loading, can } = useAccess()
    if (loading) return <>{children(false)}</>
    const ok = can(action, moduleKey, spaceId)
    if (as === 'show') return <>{ok ? children(true) : null}</>
    // disable
    return <span title={ok ? '' : reason}>{children(ok)}</span>
}