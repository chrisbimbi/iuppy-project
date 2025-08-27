import React from 'react'
import { Navigate } from 'react-router-dom'
import { ModuleKey } from '@shared/types'
import { useCompanyModulesCtx } from '../modules/company/providers/CompanyModulesProvider';

export const RequireModule: React.FC<{ moduleKey: ModuleKey; children: React.ReactNode }> = ({ moduleKey, children }) => {
    const { loading, isEnabled } = useCompanyModulesCtx()

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-20">
                <span className="spinner-border" aria-hidden="true"></span>
            </div>
        )
    }

    if (!isEnabled(moduleKey)) {
        // Agora usamos a tua página de erros
        return <Navigate to="/error/403" replace />
    }

    return <>{children}</>
}