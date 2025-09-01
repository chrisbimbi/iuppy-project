import React from 'react'
import { useAccess } from '../providers/AccessProvider'
import { ModuleAction } from '@shared/types/AccessControl'
import { ModuleKey } from '@shared/types'

export const RequireCapability: React.FC<{
    action: ModuleAction
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