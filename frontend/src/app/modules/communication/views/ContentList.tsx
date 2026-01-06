import React, { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { News as Content } from '@shared/types'
import { Spinner } from 'react-bootstrap'
import { useIntl } from 'react-intl'

// Tipagem estendida para suportar métricas na listagem
type Item = Content & {
  metrics?: {
    recebivel?: number
    open?: number
    unique?: number
    ack?: number
    reactions?: number
    comments?: number
    shares?: number
    base?: number
  }
  pushSent?: boolean
}

type Props = {
  channelName: string | null
  items: Item[]
  loading?: boolean
  error?: string | null
  selectedIds: string[]
  onSelect: (id: string, checked: boolean) => void

  // Handlers
  onEditChannel?: () => void
  onCreatePost?: () => void
  onEdit?: (id: string) => void
  onDuplicate?: (id: string) => void
  onDelete?: (id: string) => void
  onDeleteMultiple?: () => void
  onDuplicateMultiple?: () => void
  onTogglePublishMultiple?: () => Promise<void>
}



function formatDate(d?: string | Date | null) {
  if (!d) return '-'
  try {
    const dt = typeof d === 'string' ? new Date(d) : d
    return format(dt, "dd MMM, HH:mm", { locale: ptBR })
  } catch { return '-' }
}

const ContentList: React.FC<Props> = ({
  channelName,
  items,
  loading,
  error,
  selectedIds,
  onSelect,
  onEditChannel,
  onCreatePost,
  onEdit,
  onDuplicate,
  onDelete,
  onDeleteMultiple,
  onDuplicateMultiple,
  onTogglePublishMultiple,

}) => {
  const intl = useIntl()
  const [search, setSearch] = useState('')

  // Filtro client-side
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter((i) => {
      const tags = i.hashtags?.join(' ').toLowerCase() || ''
      return [i.title, i.subtitle, tags].some((v) =>
        String(v ?? '').toLowerCase().includes(term)
      )
    })
  }, [items, search])

  // KPIs do Canal (soma da tela atual)
  const channelStats = useMemo(() => {
    let reach = 0, views = 0, reacts = 0
    filtered.forEach(i => {
      if (i.isPublished) {
        reach += (i.metrics?.recebivel || i.metrics?.base || 0)
        views += (i.metrics?.unique || 0)
        reacts += (i.metrics?.reactions || 0)
      }
    })
    return { reach, views, reacts }
  }, [filtered])

  const allChecked = filtered.length > 0 && filtered.every((i) => selectedIds.includes(i.id))
  const someChecked = !allChecked && filtered.some((i) => selectedIds.includes(i.id))
  const toggleAll = () => filtered.forEach((i) => onSelect(i.id, !allChecked))

  return (
    <div className="card border-0 shadow-sm">
      {/* Header Rico */}
      <div className="card-header align-items-center py-5 gap-2 gap-md-5">
        <div className="card-title d-flex flex-column">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold fs-3 text-gray-900">{channelName || 'Conteúdos'}</span>
            <span className="badge badge-light-primary fs-8 fw-bold">{intl.formatMessage({ id: 'COMMUNICATION.LIST.HEADER.TITLE' }, { count: items.length })}</span>
          </div>
          {!loading && (
            <div className="text-muted fs-7 fw-bold mt-1">
              {intl.formatMessage({ id: 'COMMUNICATION.LIST.HEADER.POTENTIAL_REACH' }, { value: <span className="text-primary">{channelStats.reach}</span> })} •
              {intl.formatMessage({ id: 'COMMUNICATION.LIST.HEADER.VIEWS' }, { value: <span className="text-success">{channelStats.views}</span> })} •
              {intl.formatMessage({ id: 'COMMUNICATION.LIST.HEADER.INTERACTIONS' }, { value: <span className="text-info">{channelStats.reacts}</span> })}
            </div>
          )}
        </div>

        <div className="card-toolbar d-flex flex-wrap gap-3">
          <div className="d-flex align-items-center position-relative my-1">
            <i className="ki-outline ki-magnifier fs-3 position-absolute ms-4"></i>
            <input
              type="text"
              className="form-control form-control-solid w-200px ps-12"
              placeholder={intl.formatMessage({ id: 'COMMUNICATION.LIST.SEARCH.PLACEHOLDER' })}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {onEditChannel && (
            <button className="btn btn-light btn-active-light-primary" onClick={onEditChannel}>
              <i className="ki-outline ki-pencil fs-2"></i> {intl.formatMessage({ id: 'COMMUNICATION.LIST.BUTTON.EDIT' })}
            </button>
          )}
          {onCreatePost && (
            <button className="btn btn-primary" onClick={onCreatePost}>
              <i className="ki-outline ki-plus fs-2"></i> {intl.formatMessage({ id: 'COMMUNICATION.LIST.BUTTON.NEW_POST' })}
            </button>
          )}
        </div>
      </div>

      <div className="card-body pt-0">
        {/* Barra de Ações em Massa */}
        {(onDeleteMultiple || onDuplicateMultiple || onTogglePublishMultiple) && selectedIds.length > 0 && (
          <div className="d-flex align-items-center justify-content-between bg-light-primary rounded p-4 mb-5 border border-primary border-dashed">
            <div className="fw-bold text-primary">
              {intl.formatMessage({ id: 'COMMUNICATION.LIST.SELECTED' }, { count: selectedIds.length })}
            </div>
            <div className="d-flex gap-2">
              {onTogglePublishMultiple && (
                <button className="btn btn-sm btn-active-primary btn-light" onClick={onTogglePublishMultiple}>
                  {intl.formatMessage({ id: 'COMMUNICATION.LIST.BUTTON.CHANGE_STATUS' })}
                </button>
              )}
              {onDuplicateMultiple && (
                <button className="btn btn-sm btn-active-primary btn-light" onClick={onDuplicateMultiple}>
                  {intl.formatMessage({ id: 'COMMUNICATION.LIST.ACTION.DUPLICATE' })}
                </button>
              )}
              {onDeleteMultiple && (
                <button className="btn btn-sm btn-danger" onClick={onDeleteMultiple}>
                  {intl.formatMessage({ id: 'COMMUNICATION.LIST.ACTION.DELETE' })}
                </button>
              )}
            </div>
          </div>
        )}

        {loading && <div className="d-flex justify-content-center py-10"><Spinner animation="border" variant="primary" /></div>}
        {!loading && error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && (
          <div className="table-responsive">
            <table className="table align-middle table-row-dashed fs-6 gy-5">
              <thead>
                <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                  <th className="w-10px pe-2">
                    <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                      <input className="form-check-input" type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked }} onChange={toggleAll} />
                    </div>
                  </th>
                  <th className="min-w-200px">{intl.formatMessage({ id: 'COMMUNICATION.LIST.HEADER.CONTENT' })}</th>
                  <th className="min-w-100px">{intl.formatMessage({ id: 'COMMUNICATION.LIST.HEADER.STATUS' })}</th>
                  <th className="min-w-125px">{intl.formatMessage({ id: 'COMMUNICATION.LIST.HEADER.ENGAGEMENT' })}</th>
                  <th className="min-w-70px text-center">{intl.formatMessage({ id: 'COMMUNICATION.LIST.HEADER.PUSH' })}</th>
                  <th className="min-w-125px">{intl.formatMessage({ id: 'COMMUNICATION.LIST.HEADER.DATE' })}</th>
                  <th className="text-end min-w-100px">{intl.formatMessage({ id: 'COMMUNICATION.LIST.HEADER.ACTIONS' })}</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 fw-semibold">
                {filtered.map((i) => {
                  const checked = selectedIds.includes(i.id)
                  const m = i.metrics || {}

                  return (
                    <tr key={i.id}>
                      <td>
                        <div className="form-check form-check-sm form-check-custom form-check-solid">
                          <input className="form-check-input" type="checkbox" checked={checked} onChange={(e) => onSelect(i.id, e.target.checked)} />
                        </div>
                      </td>

                      {/* Título e Tipo */}
                      <td>
                        <div className="d-flex flex-column">
                          <span className="text-gray-800 text-hover-primary mb-1 fw-bold cursor-pointer" onClick={() => onEdit?.(i.id)}>{i.title}</span>
                          <div className="d-flex flex-wrap gap-1">
                            {i.hashtags?.map(tag => (
                              <span key={tag} className="badge badge-light-primary fs-9">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td>
                        {i.isPublished ? (
                          <span className="badge badge-light-success">{intl.formatMessage({ id: 'COMMUNICATION.LIST.STATUS.PUBLISHED' })}</span>
                        ) : (
                          <span className="badge badge-light-warning">{intl.formatMessage({ id: 'COMMUNICATION.LIST.STATUS.DRAFT' })}</span>
                        )}
                      </td>

                      {/* Métricas Compactas */}
                      <td>
                        <div className="d-flex gap-4">
                          <div className="d-flex flex-column align-items-center" title={intl.formatMessage({ id: 'COMMUNICATION.LIST.TOOLTIP.VIEWS' })}>
                            <i className="ki-outline ki-eye fs-5 mb-1 text-gray-400"></i>
                            <span className="fs-7 fw-bold text-gray-700">{m.open ?? '—'}</span>
                          </div>
                          <div className="d-flex flex-column align-items-center" title={intl.formatMessage({ id: 'COMMUNICATION.LIST.TOOLTIP.REACTIONS' })}>
                            <i className="ki-outline ki-heart fs-5 mb-1 text-gray-400"></i>
                            <span className="fs-7 fw-bold text-gray-700">{m.reactions ?? '—'}</span>
                          </div>
                          <div className="d-flex flex-column align-items-center" title={intl.formatMessage({ id: 'COMMUNICATION.LIST.TOOLTIP.COMMENTS' })}>
                            <i className="ki-outline ki-message-text-2 fs-5 mb-1 text-gray-400"></i>
                            <span className="fs-7 fw-bold text-gray-700">{m.comments ?? '—'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Push Status */}
                      <td className="text-center">
                        {i.pushSent ? (
                          <i className="ki-outline ki-notification-on fs-2 text-success" title={intl.formatMessage({ id: 'COMMUNICATION.LIST.TOOLTIP.PUSH_SENT' })}></i>
                        ) : (
                          <i className="ki-outline ki-notification fs-3 text-gray-300" title={intl.formatMessage({ id: 'COMMUNICATION.LIST.TOOLTIP.NO_PUSH' })}></i>
                        )}
                      </td>

                      {/* Data */}
                      <td>
                        <div className="d-flex flex-column">
                          <span className="text-gray-800 fs-7">{formatDate(i.createdAt)}</span>
                          <span className="text-muted fs-8">{intl.formatMessage({ id: 'COMMUNICATION.LIST.LABEL.CREATION' })}</span>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="text-end">
                        <Link to={`/contents/${i.id}/stats`} className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1" title={intl.formatMessage({ id: 'COMMUNICATION.LIST.ACTION.STATS' })}>
                          <i className="ki-outline ki-chart-line-star fs-2"></i>
                        </Link>
                        {onEdit && (
                          <button className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1" onClick={() => onEdit(i.id)} title={intl.formatMessage({ id: 'COMMUNICATION.LIST.ACTION.EDIT' })}>
                            <i className="ki-outline ki-pencil fs-2"></i>
                          </button>
                        )}
                        {/* Dropdown para extras */}
                        <div className="dropdown d-inline-block">
                          <button className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm" data-bs-toggle="dropdown">
                            <i className="ki-outline ki-dots-horizontal fs-2"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            {onDuplicate && <li><button className="dropdown-item" onClick={() => onDuplicate(i.id)}>{intl.formatMessage({ id: 'COMMUNICATION.LIST.ACTION.DUPLICATE' })}</button></li>}
                            {onDelete && <li><button className="dropdown-item text-danger" onClick={() => onDelete(i.id)}>{intl.formatMessage({ id: 'COMMUNICATION.LIST.ACTION.DELETE' })}</button></li>}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!filtered.length && (
                  <tr><td colSpan={7} className="text-center text-muted py-10">{intl.formatMessage({ id: 'COMMUNICATION.LIST.EMPTY' })}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContentList