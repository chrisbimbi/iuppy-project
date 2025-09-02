import React, { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { News as Content, NewsType } from '@shared/types'
import { Spinner } from 'react-bootstrap'

type Item = Content

type Props = {
    channelName: string | null
    items: Item[]
    loading?: boolean
    error?: string | null
    selectedIds: string[]
    onSelect: (id: string, checked: boolean) => void

    // Handlers opcionais
    onEditChannel?: () => void
    onCreatePost?: () => void

    onEdit?: (id: string) => void
    onDuplicate?: (id: string) => void
    onDelete?: (id: string) => void

    onDeleteMultiple?: () => void
    onDuplicateMultiple?: () => void
    onTogglePublishMultiple?: () => Promise<void>
}

// Labels corretos para o enum atual
const TYPE_LABELS: Record<NewsType, string> = {
    [NewsType.ANNOUNCEMENT]: 'Aviso',
    [NewsType.UPDATE]: 'Atualização',
    [NewsType.ALERT]: 'Alerta',
}

function renderTypeLabel(t: Item['type']): string {
    // se vier exatamente o enum, mapeia
    if (t && TYPE_LABELS[t as NewsType]) return TYPE_LABELS[t as NewsType]
    // fallback seguro
    const s = String(t ?? '').trim()
    return s || '-'
}

function formatDate(d?: string | Date | null) {
    if (!d) return '-'
    try {
        const dt = typeof d === 'string' ? new Date(d) : d
        return format(dt, "dd/MM/yy 'às' HH:mm", { locale: ptBR })
    } catch {
        return '-'
    }
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
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        if (!term) return items
        return items.filter((i) => {
            const typePt = renderTypeLabel(i.type).toLowerCase()
            return [i.title, i.subtitle, String(i.type), typePt].some((v) =>
                String(v ?? '').toLowerCase().includes(term)
            )
        })
    }, [items, search])

    const allChecked = filtered.length > 0 && filtered.every((i) => selectedIds.includes(i.id))
    const someChecked = !allChecked && filtered.some((i) => selectedIds.includes(i.id))

    const toggleAll = () => {
        const next = !allChecked
        filtered.forEach((i) => onSelect(i.id, next))
    }

    return (
        <div className="card">
            <div className="card-header align-items-center">
                <div className="card-title">
                    <div className="fw-bold">{channelName || 'Conteúdos'}</div>
                    <div className="text-muted fs-7">
                        {items.length} item{items.length === 1 ? '' : 's'}
                    </div>
                </div>

                <div className="card-toolbar d-flex gap-2">
                    <input
                        className="form-control form-control-sm w-250px"
                        placeholder="Buscar por título, subtítulo, tipo…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    {onEditChannel && (
                        <button className="btn btn-light" onClick={onEditChannel}>
                            <i className="bi bi-pencil-square me-2" />
                            Editar canal
                        </button>
                    )}
                    {onCreatePost && (
                        <button className="btn btn-primary" onClick={onCreatePost}>
                            <i className="bi bi-plus-lg me-2" />
                            Nova postagem
                        </button>
                    )}
                </div>
            </div>

            <div className="card-body p-0">
                {(onDeleteMultiple || onDuplicateMultiple || onTogglePublishMultiple) && selectedIds.length > 0 && (
                    <div className="border-bottom p-3 d-flex align-items-center justify-content-between bg-light">
                        <div>
                            <strong>{selectedIds.length}</strong> selecionado(s)
                        </div>
                        <div className="d-flex gap-2">
                            {onTogglePublishMultiple && (
                                <button className="btn btn-sm btn-light-primary" onClick={() => onTogglePublishMultiple()}>
                                    Publicar / Despublicar
                                </button>
                            )}
                            {onDuplicateMultiple && (
                                <button className="btn btn-sm btn-light" onClick={onDuplicateMultiple}>
                                    Duplicar selecionados
                                </button>
                            )}
                            {onDeleteMultiple && (
                                <button className="btn btn-sm btn-light-danger" onClick={onDeleteMultiple}>
                                    Excluir selecionados
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="d-flex align-items-center justify-content-center py-10">
                        <Spinner animation="border" />
                    </div>
                )}
                {!loading && error && (
                    <div className="alert alert-danger m-3">{error}</div>
                )}

                {!loading && !error && (
                    <div className="table-responsive">
                        <table className="table align-middle table-row-dashed">
                            <thead>
                                <tr className="text-muted fw-bold">
                                    <th className="w-10px">
                                        <div className="form-check form-check-sm">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={allChecked}
                                                ref={(el) => {
                                                    if (el) el.indeterminate = someChecked
                                                }}
                                                onChange={toggleAll}
                                            />
                                        </div>
                                    </th>
                                    <th>Título</th>
                                    <th>Tipo</th>
                                    <th>Status</th>
                                    <th>Criado</th>
                                    <th>Atualizado</th>
                                    <th className="text-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((i) => {
                                    const checked = selectedIds.includes(i.id)
                                    return (
                                        <tr key={i.id}>
                                            <td>
                                                <div className="form-check form-check-sm">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(e) => onSelect(i.id, e.target.checked)}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <div className="fw-semibold">{i.title}</div>
                                                {i.subtitle && <div className="text-muted fs-7">{i.subtitle}</div>}
                                            </td>
                                            <td>{renderTypeLabel(i.type)}</td>
                                            <td>
                                                {i.isPublished ? (
                                                    <span className="badge badge-light-success">Publicado</span>
                                                ) : (
                                                    <span className="badge badge-light">Rascunho</span>
                                                )}
                                            </td>
                                            <td>{formatDate(i.createdAt)}</td>
                                            <td>{formatDate(i.updatedAt)}</td>
                                            <td className="text-end">
                                                <div className="btn-group">
                                                    {onEdit && (
                                                        <button
                                                            className="btn btn-sm btn-light-primary"
                                                            onClick={() => onEdit?.(i.id)}
                                                        >
                                                            Editar
                                                        </button>
                                                    )}
                                                    {(onDuplicate || onDelete) && (
                                                        <button
                                                            className="btn btn-sm btn-light dropdown-toggle dropdown-toggle-split"
                                                            data-bs-toggle="dropdown"
                                                            aria-expanded="false"
                                                        />
                                                    )}
                                                    {(onDuplicate || onDelete) && (
                                                        <ul className="dropdown-menu">
                                                            {onDuplicate && (
                                                                <li>
                                                                    <button className="dropdown-item" onClick={() => onDuplicate?.(i.id)}>
                                                                        Duplicar
                                                                    </button>
                                                                </li>
                                                            )}
                                                            {onDelete && (
                                                                <li>
                                                                    <button className="dropdown-item text-danger" onClick={() => onDelete?.(i.id)}>
                                                                        Deletar
                                                                    </button>
                                                                </li>
                                                            )}
                                                        </ul>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {!filtered.length && (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted py-10">
                                            Nenhum conteúdo encontrado.
                                        </td>
                                    </tr>
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