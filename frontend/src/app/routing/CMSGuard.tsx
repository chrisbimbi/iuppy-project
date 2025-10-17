// src/app/routing/CMSGuard.tsx
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from 'src/app/modules/auth'
import { Role } from '@shared/types'

const ALLOWED_CMS_ROLES: Array<Role | string> = [
    'super_admin',
    'company_admin',
    'content_admin',
    'hr_admin',
]

export const CMSGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth()
    const { pathname } = useLocation()

    if (!currentUser) return <Navigate to="/auth" replace state={{ from: pathname }} />

    const role = currentUser.role as Role | string
    const allowed = ALLOWED_CMS_ROLES.includes(role)
    if (!allowed) return <Navigate to="/forbidden" replace />

    return <>{children}</>
}