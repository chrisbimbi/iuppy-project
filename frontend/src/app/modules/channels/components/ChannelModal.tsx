import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Modal } from 'bootstrap'
import { ChannelsService } from '../services/channels.service'
import { spacesService } from 'src/app/modules/spaces/services/spaces.service'
import { useGroups } from 'src/app/modules/groups/provider/useGroups'
import { useUsers } from 'src/app/modules/groups/provider/useUsers'
import { ChannelType } from '@shared/types/Channel'
import type { AxiosError } from 'axios'
import './ChannelModal.css'

// ⬇️ capabilities
import { useAccess } from 'src/app/modules/company/providers/AccessProvider'
import { canActOnAnySpace, useAllowedSpaces } from '../../company/components/utils/capability-helpers'

interface Props {
  show: boolean
  onHide: () => void
  channelId?: string
  companyId: string
  onSave: () => void
}

type Feedback = { type: 'success' | 'error'; message: string }

const TYPES: { key: ChannelType; label: string; img: string }[] = [
  { key: ChannelType.ARTICLES, label: 'Artigos', img: '/media/channel-types/articles.png' },
  { key: ChannelType.MEDIA, label: 'Mídia', img: '/media/channel-types/media.png' },
  { key: ChannelType.UPDATES, label: 'Updates', img: '/media/channel-types/updates.png' },
]

const ChannelModal: React.FC<Props> = ({
  show,
  onHide,
  channelId,
  companyId,
  onSave,
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<ChannelType>(ChannelType.ARTICLES)
  const [spaces, setSpaces] = useState<{ id: string; name: string }[]>([])
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([])
  const { groups } = useGroups({ companyId })
  const { users } = useUsers(companyId)
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedContrib, setSelectedContrib] = useState<string[]>([])
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([])
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [initial, setInitial] = useState<any>({})
  const [isPublished, setIsPublished] = useState<boolean>(false)

  const groupsRef = useRef<HTMLDivElement>(null)
  const contribRef = useRef<HTMLDivElement>(null)
  const adminRef = useRef<HTMLDivElement>(null)
  const [groupsModal, setGroupsModal] = useState<Modal | null>(null)
  const [contribModal, setContribModal] = useState<Modal | null>(null)
  const [adminModal, setAdminModal] = useState<Modal | null>(null)

  // ⬇️ capabilities (channels/edit)
  const { can } = useAccess()
  const allowedSpaces = useAllowedSpaces('channels', 'edit', spaces)

  // se não puder editar em lugar nenhum, bloquear o salvar
  const canSave = useMemo(() => canActOnAnySpace(can, 'edit', 'channels', selectedSpaces), [can, selectedSpaces])

  useEffect(() => {
    if (groupsRef.current) setGroupsModal(new Modal(groupsRef.current))
    if (contribRef.current) setContribModal(new Modal(contribRef.current))
    if (adminRef.current) setAdminModal(new Modal(adminRef.current))
  }, [])

  useEffect(() => {
    spacesService.list(companyId).then(setSpaces)
  }, [companyId])

  useEffect(() => {
    if (!show) return

    if (channelId) {
      // editar
      ChannelsService.list(companyId).then(all => {
        const ch = all.find(c => c.id === channelId)
        if (!ch) return
        setName(ch.name)
        setDescription(ch.description || '')
        setType((ch.type as ChannelType) || ChannelType.ARTICLES)
        setSelectedSpaces(ch.spaceIds || [])
        setSelectedGroups(ch.groupIds || [])
        setSelectedContrib(ch.contributorIds || [])
        setSelectedAdmins(ch.adminIds || [])
        setIsPublished(!!ch.isPublished)
        setInitial({
          name: ch.name,
          description: ch.description,
          type: ch.type,
          spaces: ch.spaceIds,
          groups: ch.groupIds,
          contrib: ch.contributorIds,
          admins: ch.adminIds,
          isPublished: ch.isPublished,
        })
      })
    } else if (spaces.length) {
      // criar → pré-seleciona SOMENTE spaces permitidos
      const defaults = (allowedSpaces.length ? allowedSpaces : []).map(s => s.id)
      setSelectedSpaces(defaults)
      setSelectedGroups([])
      setSelectedContrib([])
      setSelectedAdmins([])
      setIsPublished(false)
      setInitial({
        spaces: defaults,
        groups: [],
        contrib: [],
        admins: [],
        isPublished: false,
      })
      setName('')
      setDescription('')
      setType(ChannelType.ARTICLES)
    }
  }, [show, channelId, spaces, companyId, allowedSpaces])

  const handleSubmit = async () => {
    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'O nome é obrigatório.' })
      return
    }
    if (selectedSpaces.length === 0) {
      setFeedback({ type: 'error', message: 'Selecione ao menos um espaço.' })
      return
    }
    // ⬇️ verificação final de permissão
    if (!canSave) {
      setFeedback({ type: 'error', message: 'Você não tem permissão para salvar canais nos espaços selecionados.' })
      return
    }

    const payload = {
      name,
      description,
      type,
      companyId,
      spaceIds: selectedSpaces,
      groupIds: selectedGroups,
      contributorIds: selectedContrib,
      adminIds: selectedAdmins,
      isPublished,
    }
    try {
      if (channelId) {
        await ChannelsService.updateChannel(channelId, payload)
      } else {
        await ChannelsService.createChannel(payload)
      }
      setFeedback({ type: 'success', message: 'Salvo com sucesso!' })
      onSave()
      onHide()
    } catch (e) {
      const err = e as AxiosError<any>
      const msg =
        (Array.isArray(err.response?.data?.message) && err.response?.data?.message.join(' • ')) ||
        err.response?.data?.message ||
        'Erro ao salvar canal.'
      setFeedback({ type: 'error', message: String(msg) })
    }
  }

  // options visíveis (somente espaços permitidos; admins org veem todos)
  const optionsSpaces = useMemo(() => {
    // se o usuário tem ALL_SPACES (can('edit','channels')), exibe todos
    if (can('edit', 'channels')) return spaces
    return allowedSpaces
  }, [spaces, allowedSpaces, can])

  const readOnlyNoPerm = !can('edit', 'channels') && allowedSpaces.length === 0

  return (
    <>
      {/* Modal principal */}
      <div
        className={`modal fade${show ? ' show' : ''}`}
        style={show ? { display: 'block' } : { display: 'none' }}
        tabIndex={-1}
        aria-modal={show}
        role="dialog"
      >
        <div className="modal-dialog">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">
                {channelId ? 'Editar Canal' : 'Criar Canal'}
              </h5>
              <button className="btn-close" onClick={onHide} />
            </div>

            <div className="modal-body">
              {feedback && (
                <div className={`alert alert-${feedback.type === 'success' ? 'success' : 'danger'}`}>
                  {feedback.message}
                </div>
              )}

              {readOnlyNoPerm && (
                <div className="alert alert-warning">
                  Você não tem permissão para criar/editar canais em nenhum espaço.
                </div>
              )}

              {/* Nome */}
              <div className="mb-3">
                <label className="form-label">Nome*</label>
                <input
                  className="form-control"
                  placeholder="Digite o nome do canal..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={readOnlyNoPerm}
                />
              </div>

              {/* Descrição */}
              <div className="mb-3">
                <label className="form-label">Descrição</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Breve descrição..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={readOnlyNoPerm}
                />
              </div>

              {/* Tipo de Canal */}
              <div className="mb-4">
                <label className="form-label">Tipo de Canal</label>
                <div className="d-flex gap-3 channel-type-selector">
                  {TYPES.map(t => (
                    <div
                      key={t.key}
                      className={`type-card${type === t.key ? ' selected' : ''} ${readOnlyNoPerm ? ' disabled' : ''}`}
                      onClick={() => !readOnlyNoPerm && setType(t.key)}
                    >
                      <img src={t.img} alt={t.label} />
                      <div className="mt-2">{t.label}</div>
                      {type === t.key && <span className="checkmark">✔</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Espaços */}
              <div className="mb-3">
                <label className="form-label">Espaços*</label>
                <select
                  multiple
                  className="form-select"
                  value={selectedSpaces}
                  onChange={e => {
                    const opts = Array.from(e.target.selectedOptions).map(o => o.value)
                    setSelectedSpaces(opts)
                  }}
                  disabled={readOnlyNoPerm}
                >
                  {optionsSpaces.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className="form-text">Ctrl/Cmd + clique para múltipla seleção</div>
              </div>

              {/* Publicado */}
              <div className="form-check form-switch mb-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="isPublished"
                  checked={isPublished}
                  onChange={e => setIsPublished(e.target.checked)}
                  disabled={readOnlyNoPerm}
                />
                <label htmlFor="isPublished" className="form-check-label">Publicado</label>
              </div>

              {/* Contribuidores */}
              <div className="mb-3">
                <label className="form-label">Contribuidores</label>
                <button
                  className="btn btn-outline-primary btn-sm ms-2"
                  onClick={() => !readOnlyNoPerm && contribModal?.show()}
                  disabled={readOnlyNoPerm}
                >
                  {selectedContrib.length ? 'Editar contrib.' : 'Selecionar contrib.'}
                </button>
                <div className="mt-1">
                  {users.filter(u => selectedContrib.includes(u.id)).map(u => (
                    <span key={u.id} className="badge badge-success me-1">{u.name}</span>
                  ))}
                </div>
              </div>

              {/* Administradores */}
              <div className="mb-3">
                <label className="form-label">Administradores</label>
                <button
                  className="btn btn-outline-primary btn-sm ms-2"
                  onClick={() => !readOnlyNoPerm && adminModal?.show()}
                  disabled={readOnlyNoPerm}
                >
                  {selectedAdmins.length ? 'Editar admins' : 'Selecionar admins'}
                </button>
                <div className="mt-1">
                  {users.filter(u => selectedAdmins.includes(u.id)).map(u => (
                    <span key={u.id} className="badge badge-danger me-1">{u.name}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-light" onClick={onHide}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={!canSave}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modais */}
      {/* Grupos */}
      <div className="modal fade" tabIndex={-1} ref={groupsRef}>
        <div className="modal-dialog modal-dialog-scrollable">
          <div className="modal-content p-4">
            <div className="modal-header">
              <h5 className="modal-title">Selecionar Grupos</h5>
              <button
                className="btn-close"
                onClick={() => {
                  setSelectedGroups(initial.groups || [])
                  groupsModal?.hide()
                }}
              />
            </div>
            <div className="modal-body">
              {groups.map(g => (
                <div key={g.id} className="form-check form-check-custom mb-2">
                  <input
                    id={`grp_${g.id}`}
                    className="form-check-input"
                    type="checkbox"
                    checked={selectedGroups.includes(g.id)}
                    onChange={e => {
                      const next = e.target.checked
                        ? [...selectedGroups, g.id]
                        : selectedGroups.filter(x => x !== g.id)
                      setSelectedGroups(next)
                    }}
                  />
                  <label className="form-check-label" htmlFor={`grp_${g.id}`}>{g.name}</label>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-light"
                onClick={() => {
                  setSelectedGroups(initial.groups || [])
                  groupsModal?.hide()
                }}
              >
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={() => groupsModal?.hide()}>OK</button>
            </div>
          </div>
        </div>
      </div>

      {/* Contribuidores */}
      <div className="modal fade" tabIndex={-1} ref={contribRef}>
        <div className="modal-dialog modal-dialog-scrollable">
          <div className="modal-content p-4">
            <div className="modal-header">
              <h5 className="modal-title">Selecionar Contribuidores</h5>
              <button
                className="btn-close"
                onClick={() => {
                  setSelectedContrib(initial.contrib || [])
                  contribModal?.hide()
                }}
              />
            </div>
            <div className="modal-body">
              {users.map(u => (
                <div key={u.id} className="form-check form-check-custom mb-2">
                  <input
                    id={`ctr_${u.id}`}
                    className="form-check-input"
                    type="checkbox"
                    checked={selectedContrib.includes(u.id)}
                    onChange={e => {
                      const next = e.target.checked
                        ? [...selectedContrib, u.id]
                        : selectedContrib.filter(x => x !== u.id)
                      setSelectedContrib(next)
                    }}
                  />
                  <label className="form-check-label" htmlFor={`ctr_${u.id}`}>{u.name}</label>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-light"
                onClick={() => {
                  setSelectedContrib(initial.contrib || [])
                  contribModal?.hide()
                }}
              >
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={() => contribModal?.hide()}>OK</button>
            </div>
          </div>
        </div>
      </div>

      {/* Administradores */}
      <div className="modal fade" tabIndex={-1} ref={adminRef}>
        <div className="modal-dialog modal-dialog-scrollable">
          <div className="modal-content p-4">
            <div className="modal-header">
              <h5 className="modal-title">Selecionar Administradores</h5>
              <button
                className="btn-close"
                onClick={() => {
                  setSelectedAdmins(initial.admins || [])
                  adminModal?.hide()
                }}
              />
            </div>
            <div className="modal-body">
              {users.map(u => (
                <div key={u.id} className="form-check form-check-custom mb-2">
                  <input
                    id={`adm_${u.id}`}
                    className="form-check-input"
                    type="checkbox"
                    checked={selectedAdmins.includes(u.id)}
                    onChange={e => {
                      const next = e.target.checked
                        ? [...selectedAdmins, u.id]
                        : selectedAdmins.filter(x => x !== u.id)
                      setSelectedAdmins(next)
                    }}
                  />
                  <label className="form-check-label" htmlFor={`adm_${u.id}`}>{u.name}</label>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-light"
                onClick={() => {
                  setSelectedAdmins(initial.admins || [])
                  adminModal?.hide()
                }}
              >
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={() => adminModal?.hide()}>OK</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ChannelModal