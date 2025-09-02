import React from 'react'
import { useAccess } from '../providers/AccessProvider'
import type { ModuleKey } from '@shared/types'

type CapabilityAction = 'view' | 'edit' | 'manage'

export const RequireCapability: React.FC<{
    action: CapabilityAction
    moduleKey: ModuleKey
    spaceId?: string
    fallback?: React.ReactNode
    children: React.ReactNode
}> = ({ action, moduleKey, spaceId, children, fallback }) => {
    const { loading, can } = useAccess()
    if (loading) return <></>
    if (!can(action, moduleKey, spaceId)) return <>{fallback ?? null}</>
    return <>{children}</>
}

export default RequireCapability