import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CompanyModule, ModuleKey, User } from '@shared/types'
import type { AccessGrant, UpsertAccessGrantDto, ScopeType } from '@shared/types/Access'
import { AccessService } from '../services/access.service'
import { useIntl } from 'react-intl'

type SpaceLite = { id: string; name: string }

type Props = {
  show: boolean
  onClose: () => void
  companyId: string
  user: User
  enabledModules: CompanyModule[]
  spaces: SpaceLite[]
  moduleLabels: Record<ModuleKey, string>
  readOnly?: boolean                      // ✅ NOVO
}

type Draft = {
  scopeType: ScopeType
  spaceIds: string[]
  canView: boolean
  canEdit: boolean
  canManage: boolean
}

const baseDraft = (): Draft => ({
  scopeType: 'ALL_SPACES',
  spaceIds: [],
  canView: false,
  canEdit: false,
  canManage: false,
})

const UserPermissionsModal: React.FC<Props> = ({
  show, onClose, companyId, user, enabledModules, spaces, moduleLabels, readOnly = false
}) => {
  const intl = useIntl()
  const [loading, setLoading] = useState(false)
  const [savingKey, setSavingKey] = useState<ModuleKey | null>(null)
  const isReadOnly = !!readOnly

  const moduleKeys = useMemo<ModuleKey[]>(
    () => (enabledModules || []).map(m => m.key) as ModuleKey[],
    [enabledModules]
  )

  const emptyGrants = useMemo(() => {
    const obj = {} as Record<ModuleKey, AccessGrant | undefined>
    moduleKeys.forEach(k => { obj[k] = undefined })
    return obj
  }, [moduleKeys])

  const emptyDrafts = useMemo(() => {
    const obj = {} as Record<ModuleKey, Draft>
    moduleKeys.forEach(k => { obj[k] = baseDraft() })
    return obj
  }, [moduleKeys])

  const [grants, setGrants] = useState<Record<ModuleKey, AccessGrant | undefined>>(emptyGrants)
  const [drafts, setDrafts] = useState<Record<ModuleKey, Draft>>(emptyDrafts)

  useEffect(() => {
    if (!show) return
      ; (async () => {
        setLoading(true)
        try {
          const list = await AccessService.list(companyId, user.id)
          const byKey = { ...emptyGrants }
          const ds = { ...emptyDrafts }

          moduleKeys.forEach(k => {
            const g = list.find(x => x.moduleKey === k)
            byKey[k] = g
            ds[k] = {
              scopeType: g?.scopeType ?? 'ALL_SPACES',
              spaceIds: g?.spaceIds ?? [],
              canView: !!g?.canView,
              canEdit: !!g?.canEdit,
              canManage: !!g?.canManage,
            }
          })

          setGrants(byKey)
          setDrafts(ds)
        } finally {
          setLoading(false)
        }
      })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, companyId, user.id, moduleKeys.join('|')])

  useEffect(() => {
    if (!show) return
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [show])

  const setDraft = (k: ModuleKey, patch: Partial<Draft>) => {
    if (isReadOnly) return                                 // ✅ trava alterações
    setDrafts(prev => {
      const next: Draft = { ...(prev[k] ?? baseDraft()), ...patch }
      if (next.canManage) { next.canEdit = true; next.canView = true }
      if (next.canEdit) { next.canView = true }
      if (!next.canView) { next.canEdit = false; next.canManage = false }
      if (!next.canView && !next.canEdit && !next.canManage) {
        next.scopeType = 'ALL_SPACES'; next.spaceIds = []
      }
      if (next.scopeType === 'ALL_SPACES') next.spaceIds = []
      return { ...prev, [k]: next }
    })
  }

  const toggleSpace = (k: ModuleKey, id: string) => {
    if (isReadOnly) return                                 // ✅ trava alterações
    const cur = drafts[k]?.spaceIds ?? []
    const exists = cur.includes(id)
    const next = exists ? cur.filter(x => x !== id) : [...cur, id]
    setDraft(k, { spaceIds: next })
  }

  const afterPersist = () => {
    onClose()
    window.location.reload()
  }

  const handleSave = async (k: ModuleKey) => {
    if (isReadOnly) return                                 // ✅ trava ação
    const d = drafts[k]
    setSavingKey(k)
    try {
      const dto: UpsertAccessGrantDto = {
        userId: user.id,
        moduleKey: k,
        scopeType: d.scopeType,
        spaceIds: d.scopeType === 'SPACE_IDS' ? d.spaceIds : [],
        canView: d.canView,
        canEdit: d.canEdit,
        canManage: d.canManage,
      }
      const saved = await AccessService.upsert(companyId, dto)
      setGrants(prev => ({ ...prev, [k]: saved }))
      afterPersist()
    } finally {
      setSavingKey(null)
    }
  }

  const handleClear = async (k: ModuleKey) => {
    if (isReadOnly) return                                 // ✅ trava ação
    const g = grants[k]
    if (!g?.id) {
      setDraft(k, baseDraft())
      afterPersist()
      return
    }
    setSavingKey(k)
    try {
      await AccessService.remove(companyId, g.id)
      setGrants(prev => ({ ...prev, [k]: undefined }))
      setDraft(k, baseDraft())
      afterPersist()
    } finally {
      setSavingKey(null)
    }
  }

  if (!show) return null

  const modalTree = (
    <>
      <div className="modal iuppy-modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{intl.formatMessage({ id: 'COMPANY.PERMISSIONS.MODAL.TITLE', defaultMessage: 'Permissões de {name}' }, { name: user.name || user.email })}</h5>
              <button className="btn btn-icon" onClick={onClose} aria-label="Close">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="modal-body">
              {loading ? (
                <div className="d-flex justify-content-center py-10">
                  <span className="spinner-border" />
                </div>
              ) : moduleKeys.length === 0 ? (
                <div className="alert alert-warning">
                  {intl.formatMessage({ id: 'COMPANY.PERMISSIONS.MODAL.EMPTY', defaultMessage: 'Nenhum módulo habilitado para esta empresa. Ative módulos na aba Módulos para configurar permissões.' })}
                </div>
              ) : (
                <div className="row g-6">
                  {moduleKeys.map((k) => {
                    const d = drafts[k]
                    const hasAny = d?.canView || d?.canEdit || d?.canManage
                    return (
                      <div key={k} className="col-lg-6">
                        <div className="card h-100">
                          <div className="card-header align-items-center">
                            <div className="card-title">
                              <div className="fw-bold">{moduleLabels[k] ?? k}</div>
                              <div className="text-muted fs-7">{k}</div>
                            </div>
                            <div className="card-toolbar">
                              <button
                                className="btn btn-sm btn-light-danger"
                                onClick={() => handleClear(k)}
                                disabled={savingKey === k || isReadOnly}
                                title={intl.formatMessage({ id: 'COMPANY.PERMISSIONS.MODAL.BUTTON.CLEAR_TOOLTIP', defaultMessage: 'Remover todas as permissões deste módulo' })}
                              >
                                {intl.formatMessage({ id: 'COMPANY.PERMISSIONS.MODAL.BUTTON.CLEAR', defaultMessage: 'Limpar' })}
                              </button>
                            </div>
                          </div>

                          <div className="card-body">
                            <div className="row g-4">
                              <div className="col-12">
                                <label className="form-label d-block mb-2">{intl.formatMessage({ id: 'COMPANY.PERMISSIONS.MODAL.LABEL.PERMISSIONS', defaultMessage: 'Permissões' })}</label>

                                <div className="form-check form-check-custom form-check-solid mb-2">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`${k}-view`}
                                    checked={!!d?.canView}
                                    onChange={e => setDraft(k, { canView: e.target.checked })}
                                    disabled={isReadOnly}
                                  />
                                  <label className="form-check-label" htmlFor={`${k}-view`}>
                                    {intl.formatMessage({ id: 'COMPANY.PERMISSIONS.MODAL.LABEL.CAN_VIEW', defaultMessage: 'Pode visualizar' })}
                                  </label>
                                </div>

                                <div className="form-check form-check-custom form-check-solid mb-2">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`${k}-edit`}
                                    checked={!!d?.canEdit}
                                    disabled={!d?.canView || isReadOnly}
                                    onChange={e => setDraft(k, { canEdit: e.target.checked })}
                                  />
                                  <label className="form-check-label" htmlFor={`${k}-edit`}>
                                    {intl.formatMessage({ id: 'COMPANY.PERMISSIONS.MODAL.LABEL.CAN_EDIT', defaultMessage: 'Pode editar' })}
                                  </label>
                                </div>

                                <div className="form-check form-check-custom form-check-solid">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`${k}-manage`}
                                    checked={!!d?.canManage}
                                    disabled={!d?.canEdit || isReadOnly}
                                    onChange={e => setDraft(k, { canManage: e.target.checked })}
                                  />
                                  <label className="form-check-label" htmlFor={`${k}-manage`}>
                                    {intl.formatMessage({ id: 'COMPANY.PERMISSIONS.MODAL.LABEL.CAN_MANAGE', defaultMessage: 'Pode gerenciar (admin do módulo)' })}
                                  </label>
                                </div>
                              </div>

                              <div className="col-12">
                                <label className="form-label d-block mb-2">{intl.formatMessage({ id: 'COMPANY.PERMISSIONS.MODAL.LABEL.SCOPE', defaultMessage: 'Escopo' })}</label>

                                <div className="form-check form-check-inline">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name={`${k}-scope`}
                                    id={`${k}-all`}
                                    disabled={!hasAny || isReadOnly}
                                    checked={d?.scopeType === 'ALL_SPACES'}
                                    onChange={() => setDraft(k, { scopeType: 'ALL_SPACES' })}
                                  />
                                  <label className="form-check-label" htmlFor={`${k}-all`}>
                                    {intl.formatMessage({ id: 'COMPANY.PERMISSIONS.MODAL.LABEL.ALL_SPACES', defaultMessage: 'Todos os espaços' })}
                                  </label>
                                </div>

                                <div className="form-check form-check-inline">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name={`${k}-scope`}
                                    id={`${k}-byspaces`}
                                    disabled={!hasAny || isReadOnly}
                                    checked={d?.scopeType === 'SPACE_IDS'}
                                    onChange={() => setDraft(k, { scopeType: 'SPACE_IDS' })}
                                  />
                                  <label className="form-check-label" htmlFor={`${k}-byspaces`}>
                                    {intl.formatMessage({ id: 'COMPANY.PERMISSIONS.MODAL.LABEL.BY_SPACES', defaultMessage: 'Por espaços' })}
                                  </label>
                                </div>
                              </div>

                              {hasAny && d?.scopeType === 'SPACE_IDS' && (
                                <div className="col-12">
                                  <div className="border rounded p-3">
                                    <div className="fw-semibold mb-2">{intl.formatMessage({ id: 'COMPANY.PERMISSIONS.MODAL.LABEL.SELECT_SPACES', defaultMessage: 'Selecionar espaços' })}</div>
                                    <div className="row g-2">
                                      {spaces.length === 0 && (
                                        <div className="text-muted">{intl.formatMessage({ id: 'COMPANY.PERMISSIONS.MODAL.LABEL.NO_SPACES', defaultMessage: 'Nenhum espaço encontrado.' })}</div>
                                      )}
                                      {spaces.map(s => (
                                        <div key={s.id} className="col-6">
                                          <div className="form-check">
                                            <input
                                              className="form-check-input"
                                              type="checkbox"
                                              id={`${k}-space-${s.id}`}
                                              checked={!!d?.spaceIds?.includes(s.id)}
                                              onChange={() => toggleSpace(k, s.id)}
                                              disabled={isReadOnly}
                                            />
                                            <label className="form-check-label" htmlFor={`${k}-space-${s.id}`}>
                                              {s.name}
                                            </label>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="card-footer d-flex justify-content-end">
                            <button
                              className="btn btn-primary"
                              onClick={() => handleSave(k)}
                              disabled={savingKey === k || isReadOnly}
                            >
                              {savingKey === k ? intl.formatMessage({ id: 'COMPANY.PERMISSIONS.MODAL.BUTTON.SAVING', defaultMessage: 'Salvando…' }) : intl.formatMessage({ id: 'COMPANY.PERMISSIONS.MODAL.BUTTON.SAVE', defaultMessage: 'Salvar' })}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-light" onClick={onClose}>{intl.formatMessage({ id: 'COMPANY.PERMISSIONS.MODAL.BUTTON.CLOSE', defaultMessage: 'Fechar' })}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop iuppy-backdrop fade show"></div>
    </>
  )

  return createPortal(modalTree, document.body)
}

export default UserPermissionsModal