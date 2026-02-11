// src/app/modules/communication/pages/create/steps/Step2.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { ErrorMessage, FormikErrors, FormikTouched } from 'formik'
import { useIntl } from 'react-intl'
import { Modal } from 'bootstrap'
import { CreateNewsDto } from '@shared/types'
import { useAuth } from 'src/app/modules/auth'
import { useGroups } from 'src/app/modules/groups/provider/useGroups'
import { useUsers } from 'src/app/modules/groups/provider/useUsers'
import { AudienceMode } from '@shared/types/NewsSettings'
import { AudienceProbeResponse, NewsAudienceService } from 'src/app/modules/communication/services/news-audience.service'

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

  // modais
  const [pushModal, setPushModal] = useState<Modal | null>(null)
  const [groupsModal, setGroupsModal] = useState<Modal | null>(null)
  const [shareModal, setShareModal] = useState<Modal | null>(null)
  const [authorModal, setAuthorModal] = useState<Modal | null>(null)

  // seleção local de grupos (quando modo = GROUPS)
  const [selectedGroups, setSelectedGroups] = useState<string[]>(data.settings.targetAudience || [])
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(data.authorId || null)

  // preview da audiência
  const [audLoading, setAudLoading] = useState(false)
  const [audError, setAudError] = useState<string | null>(null)
  const [aud, setAud] = useState<AudienceProbeResponse | null>(null)

  // deeplink/web (inalterado)
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

  // define/normaliza o modo atual
  const mode: AudienceMode = useMemo(
    () => data.settings.audienceMode || AudienceMode.COMPANY,
    [data.settings.audienceMode]
  )

  // aplica modo no form e zera campos irrelevantes
  const setAudienceMode = (m: AudienceMode) => {
    setFieldValue('settings.audienceMode', m)
    if (m === AudienceMode.GROUPS) {
      if (!selectedGroups.length) groupsModal?.show()
      setFieldValue('settings.visibility', 'specific_groups')
      setFieldValue('settings.targetAudience', selectedGroups)
      setFieldValue('settings.audienceGroupIds', selectedGroups)
    } else {
      setFieldValue('settings.audienceGroupIds', [])
      setFieldValue('settings.targetAudience', [])
      if (data.settings.visibility === 'specific_groups') {
        setFieldValue('settings.visibility', 'public')
      }
    }
    // limpar ids auxiliares (preview)
    if (m !== AudienceMode.GROUPS) {
      setFieldValue('settings.audienceGroupIds', [])
    }
  }

  const handleAudienceSelect = (value: string) => {
    switch (value) {
      case 'COMPANY': setAudienceMode(AudienceMode.COMPANY); break
      case 'SPACE': setAudienceMode(AudienceMode.SPACE); break
      case 'CHANNEL': setAudienceMode(AudienceMode.CHANNEL); break
      case 'GROUPS': setAudienceMode(AudienceMode.GROUPS); break
      default: setAudienceMode(AudienceMode.COMPANY)
    }
  }

  // commit/cancel modais
  const commitGroups = () => {
    setFieldValue('settings.targetAudience', selectedGroups)
    setFieldValue('settings.audienceGroupIds', selectedGroups)
    setFieldValue('settings.visibility', selectedGroups.length ? 'specific_groups' : 'public')
    if (selectedGroups.length > 0) {
      setFieldValue('settings.audienceMode', AudienceMode.GROUPS)
    }
    groupsModal?.hide()
  }
  const cancelGroups = () => { setSelectedGroups(data.settings.targetAudience || []); groupsModal?.hide() }

  const commitAuthor = () => { setFieldValue('authorId', selectedAuthor); authorModal?.hide() }
  const cancelAuthor = () => { setSelectedAuthor(null); setFieldValue('settings.showAuthor', false); authorModal?.hide() }
  const commitPush = () => pushModal?.hide()
  const cancelPush = () => { setFieldValue('settings.pushNotification', false); pushModal?.hide() }
  const commitShare = () => shareModal?.hide()
  const cancelShare = () => { setFieldValue('settings.allowSharing', false); shareModal?.hide() }

  /**
   * Carrega spaceId a partir do channel (se necessário) para o modo SPACE em rascunho.
   * Se o seu endpoint devolver `spaceIds`, pega o primeiro.
   */
  const deriveSpaceIdFromChannel = async (channelId?: string): Promise<string | undefined> => {
    if (!channelId) return undefined
    try {
      const ch = await NewsAudienceService.getChannel(channelId)
      const sids: string[] = ch?.spaceIds || ch?.spaces?.map((s: any) => s.id) || []
      return sids[0]
    } catch {
      return undefined
    }
  }

  /**
   * Calcula a audiência (preview):
   * - Se há `editingId`: usa `probeForNews` (o backend deriva SPACE/CHANNEL pelo próprio newsId)
   * - Se ainda é rascunho:
   *    COMPANY → {mode: COMPANY}
   *    CHANNEL → {mode: CHANNEL, channelIds: [data.channelId]}
   *    SPACE   → {mode: SPACE, spaceId: (derivado do canal atual)}
   *    GROUPS  → {mode: GROUPS, groupIds: selectedGroups}
   */
  const refreshAudience = async () => {
    setAudError(null)
    setAudLoading(true)
    try {
      let res: AudienceProbeResponse | null = null

      // 👇 evita 400 e mostra mensagem clara
      if (!editingId && mode === AudienceMode.GROUPS && selectedGroups.length === 0) {
        setAud(null)
        setAudError(intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.ERROR.NO_AUDIENCE' }))
        return
      }

      // Prepare params based on current form state
      const params: any = { mode }

      if (mode === AudienceMode.GROUPS) {
        params.groupIds = selectedGroups
      } else if (mode === AudienceMode.CHANNEL) {
        if (data.channelId) {
          params.channelIds = [data.channelId]
        } else {
          throw new Error(intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.ERROR.SELECT_CHANNEL' }))
        }
      } else if (mode === AudienceMode.SPACE) {
        const spaceId = data.settings.audienceSpaceId || await deriveSpaceIdFromChannel(data.channelId)
        if (!spaceId) throw new Error(intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.ERROR.NO_SPACE' }))
        params.spaceId = spaceId
      }

      if (editingId) {
        res = await NewsAudienceService.probeForNews(editingId, params)
      } else {
        res = await NewsAudienceService.probeForDraft(params)
      }

      setAud(res)
      if (res) setFieldValue('settings.audienceSnapshot', { totalUsuarios: res.totalUsuarios, comTokenAtivo: res.comTokenAtivo })
    } catch (e: any) {
      setAud(null)
      setAudError(e?.message || intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.ERROR.CALC_FAILED' }))
    } finally {
      setAudLoading(false)
    }
  }

  // dispara cálculo quando modo/grupos/canal mudarem
  useEffect(() => {
    refreshAudience()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedGroups.join(','), data.channelId, editingId])

  return (
    <div className="w-100">
      {/* === Audiência Unificada === */}
      <div className="pb-5">
        <h2 className="fw-bolder text-dark">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.TITLE.AUDIENCE' })}</h2>
        <div className="text-gray-400 fw-bold fs-6">
          {intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.SUBTITLE.AUDIENCE' })}
        </div>
      </div>

      <div className="row mb-6">
        <div className="col-md-6">
          <label className="form-label required">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.LABEL.AUDIENCE' })}</label>
          <select
            className="form-select form-select-lg form-select-solid"
            value={mode}
            onChange={(e) => handleAudienceSelect(e.target.value)}
          >
            <option value="COMPANY">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.OPTION.COMPANY' })}</option>
            <option value="SPACE">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.OPTION.SPACE' })}</option>
            <option value="CHANNEL">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.OPTION.CHANNEL' })}</option>
            <option value="GROUPS">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.OPTION.GROUPS' })}</option>
          </select>
        </div>

        {mode === AudienceMode.GROUPS && (
          <div className="col-md-6">
            <label className="form-label required">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.LABEL.GROUPS' })}</label>
            <button type="button" className="btn btn-outline-primary" onClick={() => groupsModal?.show()}>
              {selectedGroups.length > 0
                ? intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.BUTTON.EDIT_GROUPS' })
                : intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.BUTTON.SELECT_GROUPS' })}
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

      {/* 🔍 Preview de audiência */}
      <div className="card shadow-sm mb-10">
        <div className="card-body d-flex flex-column flex-sm-row gap-6 align-items-start align-items-sm-center">
          <div className="flex-grow-1">
            <div className="fw-bold">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.CARD.ESTIMATE' })}</div>
            <div className="text-muted fs-7">
              {intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.CARD.ESTIMATE_DESC' })}
            </div>
            {audError && <div className="text-danger mt-2">{audError}</div>}
          </div>
          <div className="d-flex gap-6 align-items-center">
            <div className="text-center">
              <div className="fs-1 fw-bolder">{audLoading ? '…' : (aud?.totalUsuarios ?? '—')}</div>
              <div className="text-muted fs-8">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.LABEL.TOTAL' })}</div>
            </div>
            <div className="vr" />
            <div className="text-center">
              <div className="fs-1 fw-bolder">{audLoading ? '…' : (aud?.comTokenAtivo ?? '—')}</div>
              <div className="text-muted fs-8">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.LABEL.DELIVERABLE' })}</div>
            </div>
            <button type="button" className="btn btn-light btn-sm" onClick={refreshAudience} disabled={audLoading}>
              {intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.BUTTON.RECALCULATE' })}
            </button>
          </div>
        </div>
      </div>

      {/* === Engajamento === */}
      <div className="pb-5 mt-2">
        <h3 className="fw-bolder text-dark">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.TITLE.ENGAGEMENT' })}</h3>
        <div className="text-gray-400 fw-bold fs-6">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.SUBTITLE.ENGAGEMENT' })}</div>
      </div>
      <div className="row mb-10">
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid d-flex align-items-center">
            <input
              className="form-check-input"
              type="checkbox"
              checked={data.settings.allowSharing}
              onChange={e => {
                setFieldValue('settings.allowSharing', e.target.checked)
                if (e.target.checked) shareModal?.show()
              }}
            />
            <label className="form-check-label">&nbsp;{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.LABEL.ALLOW_SHARING' })}</label>
            {data.settings.allowSharing && (
              <button type="button" className="btn btn-link btn-sm ms-2 p-0" onClick={() => shareModal?.show()}>
                {intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.BUTTON.EDIT' })}
              </button>
            )}
          </div>
        </div>
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid">
            <input className="form-check-input" type="checkbox" checked={data.settings.allowReactions}
              onChange={e => setFieldValue('settings.allowReactions', e.target.checked)} />
            <label className="form-check-label">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.LABEL.ALLOW_REACTIONS' })}</label>
          </div>
        </div>
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid">
            <input className="form-check-input" type="checkbox" checked={data.settings.allowComments}
              onChange={e => setFieldValue('settings.allowComments', e.target.checked)} />
            <label className="form-check-label">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.LABEL.ALLOW_COMMENTS' })}</label>
          </div>
          {data.settings.allowComments && (
            <div className="form-check form-switch form-switch-custom form-switch-solid mt-2">
              <input className="form-check-input" type="checkbox" checked={data.settings.moderateComments}
                onChange={e => setFieldValue('settings.moderateComments', e.target.checked)} />
              <label className="form-check-label">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.LABEL.MODERATE_COMMENTS' })}</label>
            </div>
          )}
        </div>
      </div>

      {/* === Notificações === */}
      <div className="pb-5">
        <h3 className="fw-bolder text-dark">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.TITLE.NOTIFICATIONS' })}</h3>
        <div className="text-gray-400 fw-bold fs-6">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.SUBTITLE.NOTIFICATIONS' })}</div>
      </div>
      <div className="row mb-10">
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid d-flex align-items-center">
            <input className="form-check-input" type="checkbox" checked={data.settings.pushNotification}
              onChange={e => { setFieldValue('settings.pushNotification', e.target.checked); if (e.target.checked) pushModal?.show() }} />
            <label className="form-check-label">&nbsp;{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.LABEL.PUSH' })}</label>
            {data.settings.pushNotification && (
              <button type="button" className="btn btn-link btn-sm ms-2 p-0" onClick={() => pushModal?.show()}>
                {intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.BUTTON.EDIT' })}
              </button>
            )}
          </div>
        </div>
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid">
            <input className="form-check-input" type="checkbox" checked={data.settings.emailNotification}
              onChange={e => setFieldValue('settings.emailNotification', e.target.checked)} />
            <label className="form-check-label">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.LABEL.EMAIL' })}</label>
          </div>
        </div>
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid">
            <input className="form-check-input" type="checkbox" checked={data.settings.inAppNotification}
              onChange={e => setFieldValue('settings.inAppNotification', e.target.checked)} />
            <label className="form-check-label">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.LABEL.IN_APP' })}</label>
          </div>
        </div>
      </div>

      {/* === Publicação === */}
      <div className="pb-5">
        <h3 className="fw-bold text-dark">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.TITLE.PUBLICATION' })}</h3>
        <div className="text-gray-400 fw-bold fs-6">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.SUBTITLE.PUBLICATION' })}</div>
      </div>
      <div className="row mb-10">
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid">
            <input className="form-check-input" type="checkbox" checked={data.isPublished ?? data.isPublished}
              onChange={e => setFieldValue('isPublished', e.target.checked)} />
            <label className="form-check-label">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.LABEL.PUBLISH_IMMEDIATELY' })}</label>
          </div>
        </div>
        {!data.isPublished && (
          <>
            <div className="col-md-4">
              <div className="form-check form-switch form-switch-custom form-switch-solid">
                <input className="form-check-input" type="checkbox" checked={data.settings.schedulePublication}
                  onChange={e => setFieldValue('settings.schedulePublication', e.target.checked)} />
                <label className="form-check-label">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.LABEL.SCHEDULE' })}</label>
              </div>
              {data.settings.schedulePublication && (
                <input
                  type="datetime-local"
                  className="form-control form-control-solid mt-2"
                  value={data.settings.schedulePublishDate
                    ? new Date(data.settings.schedulePublishDate).toISOString().slice(0, 16)
                    : ''}
                  onChange={e => setFieldValue('settings.schedulePublishDate', e.target.value)}
                />
              )}
            </div>
            <div className="col-md-4">
              <div className="form-check form-switch form-switch-custom form-switch-solid">
                <input className="form-check-input" type="checkbox" checked={data.settings.expirePublication}
                  onChange={e => setFieldValue('settings.expirePublication', e.target.checked)} />
                <label className="form-check-label">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.LABEL.EXPIRE' })}</label>
              </div>
              {data.settings.expirePublication && (
                <input
                  type="datetime-local"
                  className="form-control form-control-solid mt-2"
                  value={data.settings.expirationDate
                    ? new Date(data.settings.expirationDate).toISOString().slice(0, 16)
                    : ''}
                  onChange={e => setFieldValue('settings.expirationDate', e.target.value)}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* === Outras Opções === */}
      <div className="pb-5">
        <h3 className="fw-bolder text-dark">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.TITLE.OTHER' })}</h3>
        <div className="text-gray-400 fw-bold fs-6">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.SUBTITLE.OTHER' })}</div>
      </div>
      <div className="row mb-10">
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid d-flex align-items-center">
            <input
              className="form-check-input"
              type="checkbox"
              checked={data.settings.showAuthor}
              onChange={e => {
                setFieldValue('settings.showAuthor', e.target.checked)
                if (e.target.checked) { setSelectedAuthor(null); authorModal?.show() }
              }}
            />
            <label className="form-check-label">&nbsp;{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.LABEL.SHOW_AUTHOR' })}</label>
            {selectedAuthor && data.settings.showAuthor && data.authorId !== currentUser!.id && (
              <button type="button" className="btn btn-link btn-sm ms-2 p-0" onClick={() => authorModal?.show()}>
                {intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.BUTTON.EDIT' })}
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
              onChange={e => setFieldValue('settings.pinToTop', e.target.checked)} />
            <label className="form-check-label">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.LABEL.PIN' })}</label>
          </div>
        </div>
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid">
            <input className="form-check-input" type="checkbox" checked={data.mustAcknowledge}
              onChange={e => setFieldValue('mustAcknowledge', e.target.checked)} />
            <label className="form-check-label">
              Exigir Ciência (NR-1)
              <span className="form-text text-muted d-block mt-1 fs-8">Obrigatório "Li e estou ciente"</span>
            </label>
          </div>
        </div>
        <div className="col-md-4">
          <div className="form-check form-switch form-switch-custom form-switch-solid">
            <input className="form-check-input" type="checkbox" checked={data.isNr1}
              onChange={e => setFieldValue('isNr1', e.target.checked)} />
            <label className="form-check-label">
              Conteúdo NR-1
              <span className="form-text text-muted d-block mt-1 fs-8">Marcar como parte do NR-1 Hub</span>
            </label>
          </div>
        </div>
      </div>

      {/* Push Notification Modal */}
      <div className="modal fade" id="kt_modal_push_notification" tabIndex={-1}>
        <div className="modal-dialog"><div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.PUSH.TITLE' })}</h5>
            <button type="button" className="btn-close" onClick={cancelPush} />
          </div>
          <div className="modal-body">
            <div className="mb-10">
              <label className="form-label">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.PUSH.LABEL.TITLE' })}</label>
              <input type="text" className="form-control form-control-solid"
                value={data.settings.pushTitle || ''} onChange={e => setFieldValue('settings.pushTitle', e.target.value)} />
            </div>
            <div className="mb-10">
              <label className="form-label">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.PUSH.LABEL.CONTENT' })}</label>
              <textarea className="form-control form-control-solid" rows={3}
                value={data.settings.pushContent || ''} onChange={e => setFieldValue('settings.pushContent', e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={cancelPush}>{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.BUTTON.CANCEL' })}</button>
            <button type="button" className="btn btn-primary" onClick={commitPush}>{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.BUTTON.OK' })}</button>
          </div>
        </div></div>
      </div>

      {/* Select Groups Modal */}
      <div className="modal fade" id="kt_modal_select_groups" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-scrollable"><div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.GROUPS.TITLE' })}</h5>
            <button type="button" className="btn-close" onClick={cancelGroups} />
          </div>
          <div className="modal-body">
            {groups.map(g => (
              <div key={g.id} className="form-check form-check-sm form-check-custom form-check-solid">
                <input className="form-check-input" type="checkbox" id={`grp_${g.id}`}
                  checked={selectedGroups.includes(g.id)}
                  onChange={(e) => {
                    setSelectedGroups(e.target.checked
                      ? [...selectedGroups, g.id]
                      : selectedGroups.filter(x => x !== g.id))
                  }} />
                <label className="form-check-label" htmlFor={`grp_${g.id}`}>{g.name}</label>
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={cancelGroups}>{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.BUTTON.CANCEL' })}</button>
            <button type="button" className="btn btn-primary" onClick={commitGroups}>{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.BUTTON.OK' })}</button>
          </div>
        </div></div>
      </div>

      {/* Share Options Modal */}
      <div className="modal fade" id="kt_modal_share_options" tabIndex={-1}>
        <div className="modal-dialog"><div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.SHARE.TITLE' })}</h5>
            <button type="button" className="btn-close" onClick={cancelShare} />
          </div>
          <div className="modal-body">
            <div className="mb-10">
              <label className="form-label">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.SHARE.LABEL.LINK' })}</label>
              <input
                type="text"
                className="form-control form-control-solid"
                value={data.settings.shareUrl || ''}
                onChange={e => setFieldValue('settings.shareUrl', e.target.value)}
                placeholder={intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.SHARE.PLACEHOLDER' })}
              />
              <div className="d-flex gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={!editingId}
                  title={editingId ? '' : intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.SHARE.HINT' })}
                  onClick={() => setFieldValue('settings.shareUrl', deeplinkFor(editingId))}
                >
                  {intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.SHARE.BUTTON.DEEPLINK' })}
                </button>
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={!editingId}
                  title={editingId ? '' : intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.SHARE.HINT' })}
                  onClick={() => setFieldValue('settings.shareUrl', webUrlFor(editingId))}
                >
                  {intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.SHARE.BUTTON.WEB' })}
                </button>
              </div>
              {!editingId && (
                <small className="text-muted d-block mt-2">
                  {intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.SHARE.HINT' })}
                </small>
              )}
            </div>
            <div className="mb-10">
              <label className="form-label">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.SHARE.LABEL.TEXT' })}</label>
              <textarea
                className="form-control form-control-solid"
                rows={2}
                value={data.settings.shareText || ''}
                onChange={e => setFieldValue('settings.shareText', e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={cancelShare}>{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.BUTTON.CANCEL' })}</button>
            <button type="button" className="btn btn-primary" onClick={commitShare}>{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.BUTTON.OK' })}</button>
          </div>
        </div></div>
      </div>

      {/* Select Author Modal */}
      <div className="modal fade" id="kt_modal_select_author" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-scrollable"><div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.AUTHOR.TITLE' })}</h5>
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
            <button type="button" className="btn btn-light" onClick={cancelAuthor}>{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.BUTTON.CANCEL' })}</button>
            <button type="button" className="btn btn-primary" onClick={commitAuthor}>{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP2.MODAL.BUTTON.OK' })}</button>
          </div>
        </div></div>
      </div>
    </div >
  )
}

export default Step2