import React from 'react'
import { Navigate } from 'react-router-dom'
import { useCompanyModulesCtx } from 'src/app/modules/company/providers/CompanyModulesProvider'
import { AsideDefault } from 'src/layout/components/aside/AsideDefault'
import { Content } from 'src/layout/components/Content'
import { PageTitle } from 'src/layout/core'

const FIRST_MODULES_ORDER: Array<'surveys'> = ['surveys'] // adicione aqui no futuro: 'forms', 'onboarding', ...

const ModulesLanding: React.FC = () => {
    const { loading, isEnabled } = useCompanyModulesCtx()

    if (loading) {
        return (
            <div className="app-container container-xxl">
                <div className="app-page" id="kt_app_page">
                    <AsideDefault />
                    <Content>
                        <div className="d-flex justify-content-center py-20">
                            <span className="spinner-border" aria-hidden="true" />
                        </div>
                    </Content>
                </div>
            </div>
        )
    }

    const firstEnabled = FIRST_MODULES_ORDER.find(k => isEnabled(k))
    if (firstEnabled === 'surveys') return <Navigate to="/modules/surveys" replace />

    return (
        <div className="app-container container-xxl">
            <div className="app-page" id="kt_app_page">
                <AsideDefault />
                <Content>
                    <PageTitle breadcrumbs={[]}>Módulos</PageTitle>
                    <div className="alert alert-warning">
                        Nenhum módulo habilitado para sua empresa. Peça a um administrador para ativar em
                        <strong> Empresa → Identidade Visual/Módulos</strong>.
                    </div>
                </Content>
            </div>
        </div>
    )
}

export default ModulesLanding