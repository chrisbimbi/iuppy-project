// frontend/src/app/modules/company/controllers/CompanySettingsPage.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { AsideDefault } from 'src/layout/components/aside/AsideDefault'
import { Content } from 'src/layout/components/Content'
import { PageTitle } from 'src/layout/core'
import { useAuth } from 'src/app/modules/auth'
import { CompanyModulesService } from '../services/companyModules.service'
import { CompanySettingsService } from '../services/companySettings.service'
import { UsersService } from 'src/app/modules/users/services/users.service'
import { spacesService } from 'src/app/modules/spaces/services/spaces.service'
import { ChannelsService } from 'src/app/modules/channels/services/channels.service'
import { useGroups } from 'src/app/modules/groups/provider/useGroups'
import { CompanyModule, CompanySettings, ModuleKey, Role, User } from '@shared/types'
import { useNavigate } from 'react-router-dom'
import '../styles/phone-preview.css'
import LogoUploader from '../components/LogoUploader'
import UserPermissionsModal from '../components/UserPermissionsModal'

// labels dos módulos
const MODULE_LABELS: Record<ModuleKey, string> = {
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
}

type TabKey = 'branding' | 'users' | 'entities' | 'modules'
const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
    { key: 'branding', label: 'Identidade Visual', icon: 'bi-palette' },
    { key: 'users', label: 'Usuários', icon: 'bi-people' },
    { key: 'entities', label: 'Entidades', icon: 'bi-diagram-2' },
    { key: 'modules', label: 'Módulos', icon: 'bi-grid' },
]

const defaultBrandingColor = (v?: string, fallback = '#ffffff') => v || fallback

const CompanySettingsPage: React.FC = () => {
    const { currentUser } = useAuth()
    const navigate = useNavigate()
    const companyId = currentUser?.companyId as string

    const [active, setActive] = useState<TabKey>('branding')

    // Settings
    const [settings, setSettings] = useState<CompanySettings | null>(null)
    const [savingSettings, setSavingSettings] = useState(false)
    const [savedSettings, setSavedSettings] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    // Modules
    const [modules, setModules] = useState<CompanyModule[]>([])
    const [updatingKey, setUpdatingKey] = useState<ModuleKey | null>(null)

    // Users / Entities
    const [users, setUsers] = useState<User[]>([])
    const [spaces, setSpaces] = useState<{ id: string; name: string }[]>([])
    const [channelsCount, setChannelsCount] = useState<number>(0)
    const { groups } = useGroups({ companyId })

    // ---- NOVO: filtro e modal de permissões ----
    const [userFilter, setUserFilter] = useState<'all' | 'admins' | 'collab'>('all')
    const [permUser, setPermUser] = useState<User | null>(null)

    // roles administrativos (ajuste aqui se tiver mais perfis admin)
    const adminRoles = useMemo(
        () => new Set<Role | string>([
            'super_admin',
            'company_admin',
            'content_admin',
            'hr_admin',
            // Role.SuperAdmin, Role.CompanyAdmin, Role.ContentAdmin, Role.HrAdmin // se preferir via enum
        ]),
        []
    )

    const filteredUsers = useMemo(() => {
        if (userFilter === 'all') return users
        if (userFilter === 'admins') return users.filter(u => adminRoles.has(u.role))
        return users.filter(u => !adminRoles.has(u.role))
    }, [users, userFilter, adminRoles])

    // somente módulos habilitados (usado pelo modal)
    const enabledModules = useMemo(
        () => modules.filter(m => !!m.enabled),
        [modules]
    )
    // --------------------------------------------

    const canToggleModules = useMemo(
        () => !!currentUser && [Role.SuperAdmin, Role.CompanyAdmin].includes(currentUser.role),
        [currentUser?.role]
    )

    useEffect(() => {
        if (!companyId) return
        CompanySettingsService.get(companyId).then(setSettings)
        CompanyModulesService.list(companyId).then(setModules)
        UsersService.list(companyId).then(setUsers)
        spacesService.list(companyId).then(setSpaces)
        ChannelsService.list(companyId)
            .then(list => setChannelsCount(list.length))
            .catch(() => setChannelsCount(0))
    }, [companyId])

    // ---------- handlers ----------
    const handleBrandingChange = (patch: Partial<CompanySettings['branding']>) => {
        if (!settings) return
        setSettings({ ...settings, branding: { ...(settings.branding || {}), ...patch } })
    }

    const handleLocaleChange = (field: 'defaultLocale' | 'supportedLocales', value: any) => {
        if (!settings) return
        setSettings({ ...settings, [field]: value })
    }

    const saveBranding = async () => {
        if (!settings) return
        setSavingSettings(true)
        setSaveError(null)
        setSavedSettings(false)
        try {
            const saved = await CompanySettingsService.upsert(companyId, {
                defaultLocale: settings.defaultLocale,
                supportedLocales: settings.supportedLocales,
                branding: settings.branding,
            })
            setSettings(saved)
            setSavedSettings(true)
            setTimeout(() => setSavedSettings(false), 4000)
        } catch (e: any) {
            setSaveError('Não foi possível salvar as alterações.')
        } finally {
            setSavingSettings(false)
        }
    }

    const handleModuleToggle = async (key: ModuleKey, enabled: boolean) => {
        if (!canToggleModules) return
        setUpdatingKey(key)
        try {
            await CompanyModulesService.upsert(companyId, key, enabled)
            window.location.reload()
        } finally {
            setUpdatingKey(null)
        }
    }

    // ---------- preview styles (escopado!) ----------
    const previewStyles = useMemo(() => {
        const b = settings?.branding || {}
        return {
            backgroundColor: defaultBrandingColor((b as any).background, '#ffffff'),
            color: defaultBrandingColor((b as any).textOnBackground, '#1e1e2d'),
            ['--preview-primary' as any]: defaultBrandingColor(b.primary, '#0665d0'),
        } as React.CSSProperties
    }, [settings])

    return (
        <div className="app-container container-xxl">
            <div className="app-page" id="kt_app_page">
                <AsideDefault />
                <Content>
                    <PageTitle breadcrumbs={[]}>Configurações da Empresa</PageTitle>

                    <div className="card">
                        <div className="card-header card-header-stretch">
                            <div className="card-title">
                                <ul className="nav nav-stretch nav-line-tabs border-0 fs-6">
                                    {TABS.map(t => (
                                        <li key={t.key} className="nav-item">
                                            <button
                                                className={`nav-link btn btn-link ${active === t.key ? 'active' : ''}`}
                                                onClick={() => setActive(t.key)}
                                            >
                                                <i className={`bi ${t.icon} me-2`} /> {t.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="card-body p-9">
                            {/* TAB: Branding */}
                            {active === 'branding' && settings && (
                                <div className="row g-9">
                                    {/* Coluna de formulário */}
                                    <div className="col-lg-7">
                                        {/* Alerts */}
                                        {savedSettings && (
                                            <div className="alert alert-success d-flex align-items-center p-3 mb-6">
                                                <i className="bi bi-check2-circle fs-2 me-3"></i>
                                                <div><strong>Pronto!</strong> Identidade visual salva com sucesso.</div>
                                            </div>
                                        )}
                                        {saveError && (
                                            <div className="alert alert-danger p-3 mb-6">
                                                {saveError}
                                            </div>
                                        )}

                                        <div className="fs-5 fw-bold mb-4">Identidade Visual</div>
                                        <div className="text-muted mb-6">
                                            Esta personalização afeta apenas o <strong>app mobile</strong>. À direita, você vê um preview.
                                        </div>

                                        <div className="row g-6">
                                            {/* Logo com upload + crop */}
                                            <div className="col-12">
                                                <label className="form-label mb-2">Logo da empresa</label>
                                                <LogoUploader
                                                    value={settings.branding?.logoUrl}
                                                    onUploaded={(url) => handleBrandingChange({ logoUrl: url })}
                                                />
                                                <div className="form-text mt-2">
                                                    Dica: você também pode informar uma URL manualmente se preferir.
                                                </div>
                                                <input
                                                    className="form-control mt-3"
                                                    placeholder="https://…/logo.png"
                                                    value={settings.branding?.logoUrl ?? ''}
                                                    onChange={e => handleBrandingChange({ logoUrl: e.target.value })}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Título no App</label>
                                                <input
                                                    className="form-control"
                                                    placeholder="ex.: Portal Iuppy"
                                                    value={(settings.branding as any)?.appTitle ?? ''}
                                                    onChange={e => handleBrandingChange({ ...(settings.branding || {}), appTitle: e.target.value } as any)}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Subtítulo</label>
                                                <input
                                                    className="form-control"
                                                    placeholder="ex.: Comunicação interna"
                                                    value={(settings.branding as any)?.appSubtitle ?? ''}
                                                    onChange={e => handleBrandingChange({ ...(settings.branding || {}), appSubtitle: e.target.value } as any)}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Cor Primária</label>
                                                <input
                                                    type="color"
                                                    className="form-control form-control-color w-100"
                                                    value={settings.branding?.primary ?? '#0665d0'}
                                                    onChange={e => handleBrandingChange({ primary: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Fundo (App)</label>
                                                <input
                                                    type="color"
                                                    className="form-control form-control-color w-100"
                                                    value={(settings.branding as any)?.background ?? '#ffffff'}
                                                    onChange={e => handleBrandingChange({ ...(settings.branding || {}), background: e.target.value } as any)}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Texto no Fundo</label>
                                                <input
                                                    type="color"
                                                    className="form-control form-control-color w-100"
                                                    value={(settings.branding as any)?.textOnBackground ?? '#1e1e2d'}
                                                    onChange={e => handleBrandingChange({ ...(settings.branding || {}), textOnBackground: e.target.value } as any)}
                                                />
                                            </div>

                                            {(['success', 'info', 'warning', 'danger', 'gray900', 'gray600'] as const).map(k => (
                                                <div className="col-md-6" key={k}>
                                                    <label className="form-label text-capitalize">{k}</label>
                                                    <input
                                                        type="color"
                                                        className="form-control form-control-color w-100"
                                                        value={settings.branding?.[k] ?? '#ffffff'}
                                                        onChange={e => handleBrandingChange({ [k]: e.target.value } as any)}
                                                    />
                                                </div>
                                            ))}

                                            {/* Locales */}
                                            <div className="col-md-6">
                                                <label className="form-label">Idioma padrão</label>
                                                <select
                                                    className="form-select"
                                                    value={settings.defaultLocale}
                                                    onChange={e => {
                                                        handleBrandingChange({});
                                                        handleLocaleChange('defaultLocale', e.target.value);
                                                    }}
                                                >
                                                    {['pt', 'en', 'es', 'de'].map(l => (
                                                        <option key={l} value={l}>{l.toUpperCase()}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Idiomas suportados</label>
                                                <select
                                                    className="form-select"
                                                    multiple
                                                    value={settings.supportedLocales as any}
                                                    onChange={e =>
                                                        handleLocaleChange(
                                                            'supportedLocales',
                                                            Array.from(e.target.selectedOptions).map(o => o.value)
                                                        )
                                                    }
                                                >
                                                    {['pt', 'en', 'es', 'de'].map(l => (
                                                        <option key={l} value={l}>{l.toUpperCase()}</option>
                                                    ))}
                                                </select>
                                                <div className="form-text">Ctrl/Cmd para multisseleção.</div>
                                            </div>

                                            <div className="col-12 d-flex justify-content-end">
                                                <button className="btn btn-light me-2" onClick={() => window.location.reload()}>
                                                    Cancelar
                                                </button>
                                                <button className="btn btn-primary" onClick={saveBranding} disabled={savingSettings}>
                                                    {savingSettings ? 'Salvando…' : 'Salvar alterações'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Coluna do preview (mockup celular) */}
                                    <div className="col-lg-5 d-flex justify-content-center">
                                        <div className="company-phone">
                                            <div className="notch" />
                                            <div className="screen" style={previewStyles}>
                                                <div
                                                    className="screen-header"
                                                    style={{
                                                        background: (settings.branding?.primary || '#0665d0'),
                                                        color: '#fff',
                                                    }}
                                                >
                                                    <div className="small text-uppercase fw-bold opacity-75">Iuppy App</div>
                                                </div>
                                                <div className="screen-body">
                                                    {settings.branding?.logoUrl ? (
                                                        <img className="logo" src={settings.branding.logoUrl} alt="logo" />
                                                    ) : (
                                                        <div
                                                            className="logo d-flex align-items-center justify-content-center"
                                                            style={{ background: '#fff', border: '1px dashed rgba(0,0,0,.15)' }}
                                                        >
                                                            <span className="text-muted">Logo</span>
                                                        </div>
                                                    )}

                                                    <div
                                                        className="title"
                                                        style={{ color: (settings.branding as any)?.textOnBackground || '#1e1e2d', fontSize: 22 }}
                                                    >
                                                        {(settings.branding as any)?.appTitle || 'Portal da Empresa'}
                                                    </div>
                                                    <div
                                                        className="subtitle mb-4"
                                                        style={{ color: (settings.branding as any)?.textOnBackground || '#1e1e2d' }}
                                                    >
                                                        {(settings.branding as any)?.appSubtitle || 'Comunicação interna e novidades'}
                                                    </div>

                                                    <div className="d-grid gap-2">
                                                        <button
                                                            className="btn"
                                                            style={{
                                                                background: (settings.branding?.primary || '#0665d0'),
                                                                borderColor: 'transparent',
                                                                color: '#fff',
                                                            }}
                                                        >
                                                            Botão Primário
                                                        </button>
                                                        <div className="card card-bordered p-3" style={{ borderColor: 'rgba(0,0,0,.08)' }}>
                                                            <div className="fw-bold" style={{ color: settings.branding?.gray900 || '#1e1e2d' }}>
                                                                Últimas notícias
                                                            </div>
                                                            <div className="text-muted" style={{ color: settings.branding?.gray600 || '#7e8299' }}>
                                                                Aqui aparece um resumo do conteúdo…
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: Users */}
                            {active === 'users' && (
                                <div className="row g-9">
                                    <div className="col-12 d-flex flex-wrap justify-content-between align-items-center gap-3">
                                        <div>
                                            <div className="fs-5 fw-bold">Usuários ({users.length})</div>
                                            <div className="text-muted">Gerencie a equipe e suas permissões por módulo.</div>
                                        </div>

                                        <div className="d-flex align-items-center gap-2">
                                            <div className="btn-group" role="group" aria-label="Filtro de usuários">
                                                <button
                                                    className={`btn btn-sm ${userFilter === 'all' ? 'btn-primary' : 'btn-light-primary'}`}
                                                    onClick={() => setUserFilter('all')}
                                                >
                                                    Todos
                                                </button>
                                                <button
                                                    className={`btn btn-sm ${userFilter === 'admins' ? 'btn-primary' : 'btn-light-primary'}`}
                                                    onClick={() => setUserFilter('admins')}
                                                >
                                                    Admins
                                                </button>
                                                <button
                                                    className={`btn btn-sm ${userFilter === 'collab' ? 'btn-primary' : 'btn-light-primary'}`}
                                                    onClick={() => setUserFilter('collab')}
                                                >
                                                    Colaboradores
                                                </button>
                                            </div>

                                            <button className="btn btn-light-primary" onClick={() => navigate('/groups')}>
                                                <i className="bi bi-people me-2" /> Gerenciar grupos
                                            </button>
                                        </div>
                                    </div>

                                    <div className="col-12">
                                        <div className="table-responsive">
                                            <table className="table align-middle table-row-dashed">
                                                <thead>
                                                    <tr className="text-muted fw-bold">
                                                        <th>Nome</th>
                                                        <th>E-mail</th>
                                                        <th>Perfil</th>
                                                        <th className="text-end">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredUsers.map(u => (
                                                        <tr key={u.id}>
                                                            <td className="fw-semibold">{u.name || u.displayName || '-'}</td>
                                                            <td>{u.email}</td>
                                                            <td>
                                                                {adminRoles.has(u.role)
                                                                    ? <span className="badge badge-light-primary text-uppercase">{u.role}</span>
                                                                    : <span className="badge badge-light text-uppercase">{u.role}</span>}
                                                            </td>
                                                            <td className="text-end">
                                                                <button
                                                                    className="btn btn-sm btn-light-primary"
                                                                    onClick={() => setPermUser(u)}
                                                                    disabled={!enabledModules.length}
                                                                    title={enabledModules.length ? 'Permissões por módulo' : 'Ative ao menos um módulo'}
                                                                >
                                                                    <i className="bi bi-shield-check me-2"></i>
                                                                    Permissões
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {!filteredUsers.length && (
                                                        <tr><td colSpan={4} className="text-center text-muted py-8">Nenhum usuário.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: Entities */}
                            {active === 'entities' && (
                                <div className="row g-6">
                                    <div className="col-md-4">
                                        <div className="card card-flush h-100">
                                            <div className="card-header">
                                                <div className="card-title">Spaces</div>
                                                <div className="card-toolbar">
                                                    <button className="btn btn-sm btn-light" onClick={() => navigate('/modules/surveys')}>
                                                        Abrir enc. & conteúdos
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {spaces.map(s => (
                                                    <div key={s.id} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                                                        <div className="fw-semibold">{s.name}</div>
                                                    </div>
                                                ))}
                                                {!spaces.length && <div className="text-muted">Nenhum espaço.</div>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-4">
                                        <div className="card card-flush h-100">
                                            <div className="card-header">
                                                <div className="card-title">Grupos</div>
                                                <div className="card-toolbar">
                                                    <button className="btn btn-sm btn-light" onClick={() => navigate('/groups')}>
                                                        Gerenciar
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {groups.map(g => (
                                                    <div key={g.id} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                                                        <div className="fw-semibold">{g.name}</div>
                                                        <span className="badge badge-light">#{g.id.slice(0, 6)}</span>
                                                    </div>
                                                ))}
                                                {!groups.length && <div className="text-muted">Nenhum grupo.</div>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-4">
                                        <div className="card card-flush h-100">
                                            <div className="card-header">
                                                <div className="card-title">Canais</div>
                                                <div className="card-toolbar">
                                                    <button className="btn btn-sm btn-light" onClick={() => navigate('/channels')}>
                                                        Abrir canais
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                <div className="fs-2 fw-bold">{channelsCount}</div>
                                                <div className="text-muted">Total de canais cadastrados</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: Modules */}
                            {active === 'modules' && (
                                <div className="row g-6">
                                    <div className="col-12 d-flex justify-content-between align-items-center mb-4">
                                        <div className="fs-5 fw-bold">Módulos</div>
                                        {!canToggleModules && (
                                            <span className="badge badge-light-warning">
                                                Alterações permitidas para SuperAdmin/CompanyAdmin
                                            </span>
                                        )}
                                    </div>
                                    <div className="col-12">
                                        <div className="row g-4">
                                            {modules
                                                .sort((a, b) => a.key.localeCompare(b.key))
                                                .map(m => (
                                                    <div key={m.key} className="col-md-4">
                                                        <div className="card card-flush h-100">
                                                            <div className="card-body d-flex align-items-center justify-content-between">
                                                                <div>
                                                                    <div className="fw-bold">{MODULE_LABELS[m.key] ?? m.key}</div>
                                                                    <div className="text-muted fs-7">{m.key}</div>
                                                                </div>
                                                                <div className="form-check form-switch">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        role="switch"
                                                                        checked={!!m.enabled}
                                                                        disabled={!canToggleModules || updatingKey === m.key}
                                                                        onChange={(e) => handleModuleToggle(m.key, e.target.checked)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            {!modules.length && (
                                                <div className="col-12">
                                                    <div className="alert alert-warning">Nenhum registro de módulo encontrado para esta empresa.</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Content>
            </div>

            {/* Modal de permissões (abre quando permUser !== null) */}
            {permUser && (
                <UserPermissionsModal
                    show={!!permUser}
                    onClose={() => setPermUser(null)}
                    companyId={companyId}
                    user={permUser}
                    enabledModules={enabledModules}
                    spaces={spaces}
                    moduleLabels={MODULE_LABELS}
                />
            )}
        </div>
    )
}

export default CompanySettingsPage