import { PropsWithChildren } from 'react'
import { useCompanyModules } from '../hooks/useCompanyModules'
import { useAuth } from 'src/app/modules/auth'

type Props = PropsWithChildren<{ moduleKey: string }>

export default function ModuleGate({ moduleKey, children }: Props) {
    const { currentUser } = useAuth()
    const companyId = currentUser?.companyId
    const { enabled, loading } = useCompanyModules(companyId)

    if (loading) return <div className="p-10">Carregando permissões…</div>
    if (!enabled(moduleKey)) {
        return (
            <div className="p-10">
                <div className="alert alert-warning">
                    Módulo <strong>{moduleKey}</strong> está desabilitado para esta empresa.
                </div>
            </div>
        )
    }
    return <>{children}</>
}