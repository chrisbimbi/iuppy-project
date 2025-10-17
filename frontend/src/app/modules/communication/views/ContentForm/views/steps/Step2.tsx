import React, { useState, useEffect } from 'react'
import { ErrorMessage, FormikErrors, FormikTouched } from 'formik'
import { useIntl } from 'react-intl'
import { Modal } from 'bootstrap'
import { CreateNewsDto } from '@shared/types'
import { useAuth } from 'src/app/modules/auth'
import { useGroups } from 'src/app/modules/groups/provider/useGroups'
import { useUsers } from 'src/app/modules/groups/provider/useUsers'

interface Step2Props {
  data: CreateNewsDto
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void
  errors: FormikErrors<CreateNewsDto>
  touched: FormikTouched<CreateNewsDto>
  editingId?: string | undefined
}

export const Step2: React.FC<Step2Props> = ({
  data,
  setFieldValue,
  errors,
  touched,
  editingId,
}) => {
  const intl = useIntl()
  const { currentUser } = useAuth()
  const { groups } = useGroups({ companyId: currentUser!.companyId })
  const { users } = useUsers(currentUser!.companyId)

  const [pushModal, setPushModal] = useState<Modal | null>(null)
  const [groupsModal, setGroupsModal] = useState<Modal | null>(null)
  const [shareModal, setShareModal] = useState<Modal | null>(null)
  const [authorModal, setAuthorModal] = useState<Modal | null>(null)

  const [selectedGroups, setSelectedGroups] = useState<string[]>(data.settings.targetAudience || [])
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(data.authorId || null)

  // Prefixos de deeplink e web podem vir do .env
  const DL_PREFIX = import.meta.env.VITE_APP_DEEPLINK_PREFIX || 'iuppy://content'
  const WEB_URL = import.meta.env.VITE_APP_WEBAPP_URL || window.location.origin

  const deeplinkFor = (id?: string) => (id ? `${DL_PREFIX}/news/${id}` : '')
  const webUrlFor = (id?: string) => (id ? `${WEB_URL}/news/${id}` : '')

  useEffect(() => {
    setPushModal(new Modal(document.getElementById('kt_modal_push_notification')!))
    setGroupsModal(new Modal(document.getElementById('kt_modal_select_groups')!))
    setShareModal(new Modal(document.getElementById('kt_modal_share_options')!))
    setAuthorModal(new Modal(document.getElementById('kt_modal_select_author')!))
  }, [])

  const handle = (field: keyof CreateNewsDto['settings'], value: any) => {
    setFieldValue(`settings.${field}`, value)
  }

  const commitGroups = () => { setFieldValue('settings.targetAudience', selectedGroups); groupsModal?.hide() }
  const cancelGroups = () => { setSelectedGroups(data.settings.targetAudience || []); groupsModal?.hide() }

  const commitAuthor = () => { setFieldValue('authorId', selectedAuthor); authorModal?.hide() }
  const cancelAuthor = () => { setSelectedAuthor(null); setFieldValue('settings.showAuthor', false); authorModal?.hide() }

  const commitPush = () => pushModal?.hide()
  const cancelPush = () => { setFieldValue('settings.pushNotification', false); pushModal?.hide() }

  const commitShare = () => shareModal?.hide()
  const cancelShare = () => { setFieldValue('settings.allowSharing', false); shareModal?.hide() }

  return (
    <div className="w-100">
      {/* Section 1: Visibility */}
      <div className="pb-5">
        <h2 className="fw-bolder text-dark">Visibilidade de Publicação</h2>
        <div className="text-gray-400 fw-bold fs-6">Defina quem pode ver este conteúdo e envio de notificações</div>
      </div>
      <div className="row mb-10">
        <div className="col-md-6">
          <label className="form-label required">Definir públicos</label>
          <select
            className="form-select form-select-lg form-select-solid"
            value={data.settings.visibility}
            onChange={e => handle('visibility', e.target.value)}
          >
            <option value="public">Público</option>
            <option value="private">Privado</option>
            <option value="specific_groups">Grupos Específicos</option>
          </select>
        </div>
        {data.settings.visibility === 'specific_groups' && (
          <div className="col-md-6">
            <label className="form-label required">Público Alvo</label>
            <button type="button" className="btn btn-outline-primary" onClick={() => groupsModal?.show()}>
              {selectedGroups.length > 0 ? 'Editar grupos selecionados...' : 'Selecionar Grupos...'}
            </button>
            <ErrorMessage name="settings.targetAudience" component="div" className="invalid-feedback" />
            {selectedGroups.length > 0 && (
              <div className="mt-2">
                {groups.filter(g => selectedGroups.includes(g.id)).map(g => (
                  <span key={g.id} className="badge badge-primary me-1">{g.name}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Engagement */}
      <div className="pb-5">
        <h3 className="fw-bolder text-dark">Engajamento</h3>
        <div className="text-gray-400 fw-bold fs-6">Compartilhamento, comentários e reações</div>
      </div>
      <div className="row mb-10">
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid d-flex align-items-center">
            <input
              className="form-check-input"
              type="checkbox"
              checked={data.settings.allowSharing}
              onChange={e => {
                handle('allowSharing', e.target.checked)
                if (e.target.checked) shareModal?.show()
              }}
            />
            <label className="form-check-label">&nbsp;Permitir compartilhamento</label>
            {data.settings.allowSharing && (
              <button type="button" className="btn btn-link btn-sm ms-2 p-0" onClick={() => shareModal?.show()}>
                Editar
              </button>
            )}
          </div>
        </div>
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid">
            <input className="form-check-input" type="checkbox" checked={data.settings.allowReactions}
              onChange={e => handle('allowReactions', e.target.checked)} />
            <label className="form-check-label">Permitir reações</label>
          </div>
        </div>
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid">
            <input className="form-check-input" type="checkbox" checked={data.settings.allowComments}
              onChange={e => handle('allowComments', e.target.checked)} />
            <label className="form-check-label">Permitir comentários</label>
          </div>
          {data.settings.allowComments && (
            <div className="form-check form-switch form-switch-custom form-switch-solid mt-2">
              <input className="form-check-input" type="checkbox" checked={data.settings.moderateComments}
                onChange={e => handle('moderateComments', e.target.checked)} />
              <label className="form-check-label">Moderar comentários</label>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Notifications */}
      <div className="pb-5">
        <h3 className="fw-bolder text-dark">Notificações</h3>
        <div className="text-gray-400 fw-bold fs-6">Push, e-mail e in-app</div>
      </div>
      <div className="row mb-10">
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid d-flex align-items-center">
            <input className="form-check-input" type="checkbox" checked={data.settings.pushNotification}
              onChange={e => { handle('pushNotification', e.target.checked); if (e.target.checked) pushModal?.show() }} />
            <label className="form-check-label">&nbsp;Enviar notificação push</label>
            {data.settings.pushNotification && (
              <button type="button" className="btn btn-link btn-sm ms-2 p-0" onClick={() => pushModal?.show()}>
                Editar
              </button>
            )}
          </div>
        </div>
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid">
            <input className="form-check-input" type="checkbox" checked={data.settings.emailNotification}
              onChange={e => handle('emailNotification', e.target.checked)} />
            <label className="form-check-label">Enviar notificação por e-mail</label>
          </div>
        </div>
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid">
            <input className="form-check-input" type="checkbox" checked={data.settings.inAppNotification}
              onChange={e => handle('inAppNotification', e.target.checked)} />
            <label className="form-check-label">Notificação in-app</label>
          </div>
        </div>
      </div>

      {/* Section 4: Scheduling */}
      <div className="pb-5">
        <h3 className="fw-bold text-dark">Datas de Publicação</h3>
        <div className="text-gray-400 fw-bold fs-6">Imediato, agendar e expirar</div>
      </div>
      <div className="row mb-10">
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid">
            <input className="form-check-input" type="checkbox" checked={data.isPublished}
              onChange={e => setFieldValue('isPublished', e.target.checked)} />
            <label className="form-check-label">Publicar imediatamente</label>
          </div>
        </div>
        {!data.isPublished && (
          <>
            <div className="col-md-4">
              <div className="form-check form-switch form-switch-custom form-switch-solid">
                <input className="form-check-input" type="checkbox" checked={data.settings.schedulePublication}
                  onChange={e => handle('schedulePublication', e.target.checked)} />
                <label className="form-check-label">Agendar publicação</label>
              </div>
              {data.settings.schedulePublication && (
                <input
                  type="datetime-local"
                  className="form-control form-control-solid mt-2"
                  value={data.settings.schedulePublishDate
                    ? new Date(data.settings.schedulePublishDate).toISOString().slice(0, 16)
                    : ''}
                  onChange={e => handle('schedulePublishDate', e.target.value)}
                />
              )}
            </div>
            <div className="col-md-4">
              <div className="form-check form-switch form-switch-custom form-switch-solid">
                <input className="form-check-input" type="checkbox" checked={data.settings.expirePublication}
                  onChange={e => handle('expirePublication', e.target.checked)} />
                <label className="form-check-label">Expirar publicação</label>
              </div>
              {data.settings.expirePublication && (
                <input
                  type="datetime-local"
                  className="form-control form-control-solid mt-2"
                  value={data.settings.expirationDate
                    ? new Date(data.settings.expirationDate).toISOString().slice(0, 16)
                    : ''}
                  onChange={e => handle('expirationDate', e.target.value)}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Section 5: Additional */}
      <div className="pb-5">
        <h3 className="fw-bolder text-dark">Outras Opções</h3>
        <div className="text-gray-400 fw-bold fs-6">Autor, pinagem e confirmação de leitura</div>
      </div>
      <div className="row mb-10">
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid d-flex align-items-center">
            <input
              className="form-check-input"
              type="checkbox"
              checked={data.settings.showAuthor}
              onChange={e => {
                handle('showAuthor', e.target.checked)
                if (e.target.checked) { setSelectedAuthor(null); authorModal?.show() }
              }}
            />
            <label className="form-check-label">&nbsp;Mostrar autor</label>
            {selectedAuthor && data.settings.showAuthor && data.authorId !== currentUser!.id && (
              <button type="button" className="btn btn-link btn-sm ms-2 p-0" onClick={() => authorModal?.show()}>
                Editar
              </button>
            )}
          </div>
          {data.authorId && data.authorId !== currentUser!.id && data.settings.showAuthor && (
            <div className="card p-3 mt-2">
              <div className="d-flex align-items-center">
                <img
                  src={users.find(u => u.id === data.authorId)?.avatarUrl || '/media/avatars/blank.png'}
                  className="rounded-circle me-3"
                  width={40}
                  height={40}
                />
                <div><div className="fw-bold">{users.find(u => u.id === data.authorId)?.name}</div></div>
              </div>
            </div>
          )}
        </div>
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid">
            <input className="form-check-input" type="checkbox" checked={data.settings.pinToTop}
              onChange={e => handle('pinToTop', e.target.checked)} />
            <label className="form-check-label">Fixar no topo</label>
          </div>
        </div>
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid">
            <input className="form-check-input" type="checkbox" checked={data.settings.acknowledgementRequired}
              onChange={e => handle('acknowledgementRequired', e.target.checked)} />
            <label className="form-check-label">Para confirmação do colaborador</label>
          </div>
        </div>
      </div>

      {/* Push Notification Modal */}
      <div className="modal fade" id="kt_modal_push_notification" tabIndex={-1}>
        <div className="modal-dialog"><div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Configurar Notificação Push</h5>
            <button type="button" className="btn-close" onClick={cancelPush} />
          </div>
          <div className="modal-body">
            <div className="mb-10">
              <label className="form-label">Título do Push</label>
              <input type="text" className="form-control form-control-solid"
                value={data.settings.pushTitle || ''} onChange={e => handle('pushTitle', e.target.value)} />
            </div>
            <div className="mb-10">
              <label className="form-label">Conteúdo do Push</label>
              <textarea className="form-control form-control-solid" rows={3}
                value={data.settings.pushContent || ''} onChange={e => handle('pushContent', e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={cancelPush}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={commitPush}>OK</button>
          </div>
        </div></div>
      </div>

      {/* Select Groups Modal */}
      <div className="modal fade" id="kt_modal_select_groups" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-scrollable"><div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Selecionar Grupos</h5>
            <button type="button" className="btn-close" onClick={cancelGroups} />
          </div>
          <div className="modal-body">
            {groups.map(g => (
              <div key={g.id} className="form-check form-check-sm form-check-custom form-check-solid">
                <input className="form-check-input" type="checkbox" id={`grp_${g.id}`}
                  checked={selectedGroups.includes(g.id)}
                  onChange={e => setSelectedGroups(e.target.checked ? [...selectedGroups, g.id] : selectedGroups.filter(x => x !== g.id))} />
                <label className="form-check-label" htmlFor={`grp_${g.id}`}>{g.name}</label>
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={cancelGroups}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={commitGroups}>OK</button>
          </div>
        </div></div>
      </div>

      {/* Share Options Modal */}
      <div className="modal fade" id="kt_modal_share_options" tabIndex={-1}>
        <div className="modal-dialog"><div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Opções de Compartilhamento</h5>
            <button type="button" className="btn-close" onClick={cancelShare} />
          </div>
          <div className="modal-body">
            <div className="mb-10">
              <label className="form-label">Link de Compartilhamento</label>
              <input
                type="text"
                className="form-control form-control-solid"
                value={data.settings.shareUrl || ''}
                onChange={e => handle('shareUrl', e.target.value)}
                placeholder="Cole um link ou use os botões abaixo"
              />
              <div className="d-flex gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={!editingId}
                  title={editingId ? '' : 'Disponível após salvar'}
                  onClick={() => handle('shareUrl', deeplinkFor(editingId))}
                >
                  Preencher com Deeplink
                </button>
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={!editingId}
                  title={editingId ? '' : 'Disponível após salvar'}
                  onClick={() => handle('shareUrl', webUrlFor(editingId))}
                >
                  Preencher com URL Web
                </button>
              </div>
              {!editingId && (
                <small className="text-muted d-block mt-2">
                  O conteúdo ainda não tem ID. Esses atalhos ficam disponíveis depois que você salvar.
                </small>
              )}
            </div>
            <div className="mb-10">
              <label className="form-label">Texto Padrão</label>
              <textarea
                className="form-control form-control-solid"
                rows={2}
                value={data.settings.shareText || ''}
                onChange={e => handle('shareText', e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={cancelShare}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={commitShare}>OK</button>
          </div>
        </div></div>
      </div>

      {/* Select Author Modal */}
      <div className="modal fade" id="kt_modal_select_author" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-scrollable"><div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Selecionar Autor</h5>
            <button type="button" className="btn-close" onClick={cancelAuthor} />
          </div>
          <div className="modal-body">
            {users.filter(u => u.id !== currentUser!.id).map(u => (
              <div key={u.id} className="form-check form-check-sm form-check-custom form-check-solid">
                <input className="form-check-input" type="radio" id={`auth_${u.id}`} name="selectAuthor"
                  checked={selectedAuthor === u.id} onChange={() => setSelectedAuthor(u.id)} />
                <label className="form-check-label" htmlFor={`auth_${u.id}`}>{u.name}</label>
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={cancelAuthor}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={commitAuthor}>OK</button>
          </div>
        </div></div>
      </div>
    </div>
  )
}