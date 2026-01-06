
import React, { useState, useEffect } from 'react'
import { PageTitle } from 'src/layout/core'
import { UsersList } from '../views/UsersList'
import { UserImportModal } from '../views/UserImportModal'
import { UserEditModal } from '../views/UserEditModal'
import UserPermissionsModal from '../../company/components/UserPermissionsModal'
import { User, CompanyModule } from '@shared/types'
import { useAuth } from 'src/app/modules/auth'
import { CompanyModulesService } from '../../company/services/companyModules.service'
import { spacesService } from 'src/app/modules/spaces/services/spaces.service'

import { UserAnalyticsPage } from '../views/UserAnalyticsPage'

export function UsersPage() {
    const [showImport, setShowImport] = useState(false)
    const [showCreate, setShowCreate] = useState(false) // Added state for create modal
    const [permUser, setPermUser] = useState<User | null>(null)
    const { currentUser } = useAuth()
    const companyId = currentUser?.companyId as string
    const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list')

    // Data for permissions modal
    const [modules, setModules] = useState<CompanyModule[]>([])
    const [spaces, setSpaces] = useState<{ id: string; name: string }[]>([])

    useEffect(() => {
        if (companyId) {
            CompanyModulesService.list(companyId).then(setModules)
            spacesService.list(companyId).then(setSpaces)
        }
    }, [companyId])

    const enabledModules = modules.filter(m => !!m.enabled)

    // Module labels (copied from CompanySettingsPage for now, should be shared)
    const MODULE_LABELS: any = {
        news: 'Notícias',
        channels: 'Canais',
        groups: 'Grupos',
        surveys: 'Enquetes',
        forms: 'Formulários',
        onboarding: 'Onboarding',
        training: 'Treinamentos',
        jobs: 'Vagas',
        birthdays: 'Aniversários',
        recognition: 'Reconhecimentos',
        quicklinks: 'Links Rápidos',
        benefits: 'Benefícios',
        vacations: 'Férias',
        podcasts: 'Podcasts',
        analytics: 'Analytics',
        chat: 'Chat',
        journeys: 'Jornadas',
    }

    return (
        <>
            <PageTitle breadcrumbs={[]}>Gerenciar Usuários</PageTitle>

            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title">
                        <ul className="nav nav-stretch nav-line-tabs border-0 fs-6">
                            <li className="nav-item">
                                <a
                                    className={`nav-link cursor-pointer ${activeTab === 'list' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('list')}
                                >
                                    Usuários
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    className={`nav-link cursor-pointer ${activeTab === 'stats' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('stats')}
                                >
                                    Estatísticas
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="card-toolbar">
                        {activeTab === 'list' && (
                            <>
                                <button
                                    className="btn btn-sm btn-light-primary me-3"
                                    onClick={() => setShowImport(true)}
                                >
                                    <i className="bi bi-file-earmark-arrow-up fs-2"></i>
                                    Importar (CSV/XLSX)
                                </button>
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => setShowCreate(true)}
                                >
                                    <i className="bi bi-plus fs-2"></i>
                                    Novo Usuário
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div className="card-body py-4">
                    {activeTab === 'list' ? (
                        <UsersList onPermissions={setPermUser} />
                    ) : (
                        <UserAnalyticsPage />
                    )}
                </div>
            </div>

            {showImport && (
                <UserImportModal
                    show={showImport}
                    handleClose={() => setShowImport(false)}
                />
            )}

            {/* Added UserEditModal for creation */}
            <UserEditModal
                show={showCreate}
                handleClose={() => setShowCreate(false)}
                user={null} // Pass null for creation
                onSuccess={() => window.location.reload()} // Simple reload or better state management
            />

            {permUser && (
                <UserPermissionsModal
                    show={!!permUser}
                    onClose={() => setPermUser(null)}
                    companyId={companyId}
                    user={permUser}
                    enabledModules={enabledModules}
                    spaces={spaces}
                    moduleLabels={MODULE_LABELS}
                    readOnly={false}
                />
            )}
        </>
    )
}
