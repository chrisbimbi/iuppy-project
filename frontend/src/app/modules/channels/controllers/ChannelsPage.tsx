// src/app/modules/channels/controllers/ChannelsPage.tsx
import React, { useEffect, useRef, useState } from 'react'
import { AsideDefault } from 'src/layout/components/aside/AsideDefault'
import { Content } from 'src/layout/components/Content'
import { useAuth } from 'src/app/modules/auth'
import { spacesService } from 'src/app/modules/spaces/services/spaces.service'
import { ChannelsService } from 'src/app/modules/channels/services/channels.service'
import { ContentService } from 'src/app/modules/communication/services/content.service'
import { Channel } from '@shared/types/Channel'
import ChannelModal from 'src/app/modules/channels/components/ChannelModal'
import { Modal } from 'bootstrap'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { format } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import { UsersService } from '../../users/services/users.service'
import { User } from '@shared/types'
import { useIntl } from 'react-intl'

interface Metrics {
    postsCount: number
    usersCount: number
    spaceNames: string[]
    lastPostDate: Date | null
}

const ChannelsPage: React.FC = () => {
    const intl = useIntl()
    const { currentUser } = useAuth()
    const [spaces, setSpaces] = useState<any[]>([])
    const [spaceId, setSpaceId] = useState<string | null>(null)

    const [channels, setChannels] = useState<Channel[]>([])
    const [metrics, setMetrics] = useState<Record<string, Metrics>>({})
    const [allUsers, setAllUsers] = useState<User[]>([])

    // reordering
    const [isReordering, setIsReordering] = useState(false)
    const [backupChannels, setBackupChannels] = useState<Channel[]>([])

    // modais create/edit & delete
    const [showChannelModal, setShowChannelModal] = useState(false)
    const [editingChannelId, setEditingChannelId] = useState<string>()
    const deleteRef = useRef<HTMLDivElement>(null)
    const [deleteModal, setDeleteModal] = useState<Modal | null>(null)
    const [toDeleteChannelId, setToDeleteChannelId] = useState<string>()

    const getDateFnsLocale = () => {
        const locale = intl.locale
        if (locale === 'en') return enUS
        if (locale === 'es') return es
        return ptBR
    }

    // carregar usuários (p/ métricas: total de usuários)
    useEffect(() => {
        let alive = true
            ; (async () => {
                if (!currentUser) return
                try {
                    const list = await UsersService.list(currentUser.companyId)
                    if (alive) setAllUsers(list)
                } catch {
                    // silencioso
                }
            })()
        return () => {
            alive = false
        }
    }, [currentUser])

    // carregar espaços
    useEffect(() => {
        let alive = true
            ; (async () => {
                if (!currentUser) return
                try {
                    const list = await spacesService.list(currentUser.companyId)
                    if (!alive) return
                    setSpaces(list)
                    // seleciona 1º espaço uma única vez
                    if (!spaceId && list.length) setSpaceId(list[0].id)
                } catch {
                    // silencioso
                }
            })()
        return () => {
            alive = false
        }
    }, [currentUser]) // intencional: sem depender de spaceId aqui

    // carregar canais do espaço selecionado
    const loadChannels = async () => {
        if (!currentUser || !spaceId) return
        try {
            const list = await ChannelsService.list(currentUser.companyId, spaceId)
            setChannels(list)
        } catch (e) {
            // silencioso; erros já são logados no serviço
        }
    }
    useEffect(() => {
        loadChannels()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, spaceId])

    // modal delete bootstrap
    useEffect(() => {
        if (deleteRef.current) setDeleteModal(new Modal(deleteRef.current))
    }, [])

    // métricas: pausa durante reordenação e cancela em unmount/troca
    useEffect(() => {
        if (!channels.length || isReordering) return

        let cancelled = false
            ; (async () => {
                const out: Record<string, Metrics> = {}

                for (const c of channels) {
                    if (cancelled) break
                    try {
                        // 3 chamadas em paralelo POR CANAL, mas processadas
                        // sequencialmente por canal para evitar abrir conexões demais
                        const [postsCount, latest, spacesInfo] = await Promise.all([
                            ContentService.countByChannel(c.id),
                            ContentService.getLatestByChannel(c.id),
                            spacesService.getByIds(c.spaceIds || []),
                        ])

                        if (cancelled) break

                        out[c.id] = {
                            postsCount,
                            usersCount: allUsers.length,
                            spaceNames: spacesInfo.map((s) => s.name),
                            lastPostDate: latest?.createdAt ? new Date(latest.createdAt) : null,
                        }
                    } catch {
                        // não trava a tela por causa de um canal com erro
                        out[c.id] = {
                            postsCount: 0,
                            usersCount: allUsers.length,
                            spaceNames: [],
                            lastPostDate: null,
                        }
                    }
                }

                if (!cancelled) setMetrics(out)
            })()

        return () => {
            cancelled = true
        }
    }, [channels, allUsers.length, isReordering])

    // abrir/fechar modal criar/editar
    const openChannelModal = (id?: string) => {
        setEditingChannelId(id)
        setShowChannelModal(true)
    }
    const closeChannelModal = () => setShowChannelModal(false)
    const handleChannelSaved = () => {
        closeChannelModal()
        loadChannels()
    }

    // delete
    const openDeleteModal = (id: string) => {
        setToDeleteChannelId(id)
        deleteModal?.show()
    }
    const confirmDelete = async () => {
        if (toDeleteChannelId) {
            try {
                await ChannelsService.deleteChannel(toDeleteChannelId)
                await loadChannels()
            } finally {
                deleteModal?.hide()
            }
        } else {
            deleteModal?.hide()
        }
    }

    // publicar / despublicar
    const handleTogglePublish = async (id: string, publish: boolean) => {
        if (!currentUser) return
        const ch = channels.find((x) => x.id === id)
        if (!ch) return
        try {
            await ChannelsService.updateChannel(id, {
                name: ch.name,
                description: ch.description || '',
                type: ch.type!, // deve estar consistente com ChannelType
                companyId: currentUser.companyId,
                spaceIds: ch.spaceIds || [],
                groupIds: ch.groupIds || [],
                contributorIds: ch.contributorIds || [],
                adminIds: ch.adminIds || [],
                isPublished: publish,
            })
            await loadChannels()
        } catch {
            // silencioso
        }
    }

    // DnD
    const handleDragEnd = (result: DropResult) => {
        if (!isReordering) return
        if (!result.destination) return
        const next = Array.from(channels)
        const [moved] = next.splice(result.source.index, 1)
        next.splice(result.destination.index, 0, moved)
        setChannels(next)
    }

    // render da tabela (sem DnD)
    const renderPlainTable = () => (
        <div className="table-responsive">
            <table className="table align-middle table-row-dashed fs-6 gy-5 mb-0">
                <thead>
                    <tr className="text-gray-400 fw-bold">
                        <th className="w-30px" />
                        <th>{intl.formatMessage({ id: 'CHANNELS.TABLE.HEADER.NAME' })}</th>
                        <th>{intl.formatMessage({ id: 'CHANNELS.TABLE.HEADER.LOCATIONS' })}</th>
                        <th>{intl.formatMessage({ id: 'CHANNELS.TABLE.HEADER.STATUS' })}</th>
                        <th className="text-end">{intl.formatMessage({ id: 'CHANNELS.TABLE.HEADER.ACTIONS' })}</th>
                    </tr>
                </thead>
                <tbody>
                    {channels.map((c) => (
                        <tr key={c.id}>
                            <td className="pe-0">
                                {/* “fantasma” do handle para manter layout alinhado */}
                                <i className="bi bi-list fs-3 text-muted opacity-25" />
                            </td>
                            <td>
                                <div className="fw-bold">{c.name}</div>
                                {metrics[c.id] && (
                                    <div className="text-gray-600 fs-7">
                                        {intl.formatMessage({ id: 'CHANNELS.METRICS.POSTS' })}: <strong>{metrics[c.id].postsCount}</strong> |
                                        {intl.formatMessage({ id: 'CHANNELS.METRICS.USERS' })}: <strong>{metrics[c.id].usersCount}</strong> |
                                        {intl.formatMessage({ id: 'CHANNELS.METRICS.SPACES' })}: <strong>{metrics[c.id].spaceNames.join(', ')}</strong>
                                        {metrics[c.id].lastPostDate && (
                                            <>
                                                | {intl.formatMessage({ id: 'CHANNELS.METRICS.LAST' })}:{' '}
                                                <strong>
                                                    {format(metrics[c.id].lastPostDate!, 'dd/MM/yyyy, HH:mm', { locale: getDateFnsLocale() })}
                                                </strong>
                                            </>
                                        )}
                                    </div>
                                )}
                            </td>
                            <td>
                                {c.spaceIds?.map((id) => {
                                    const sp = spaces.find((s) => s.id === id)
                                    return sp ? (
                                        <span key={id} className="badge badge-light me-1">
                                            {sp.name}
                                        </span>
                                    ) : null
                                })}
                            </td>
                            <td>
                                {c.isPublished ? (
                                    <span className="badge badge-success">{intl.formatMessage({ id: 'CHANNELS.STATUS.PUBLISHED' })}</span>
                                ) : (
                                    <span className="badge badge-secondary">{intl.formatMessage({ id: 'CHANNELS.STATUS.UNPUBLISHED' })}</span>
                                )}
                            </td>
                            <td className="text-end">
                                <div className="dropdown">
                                    <button className="btn btn-icon" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        <i className="bi bi-three-dots-vertical fs-5" />
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end">
                                        <li>
                                            <button className="dropdown-item" onClick={() => openChannelModal(c.id)}>
                                                <i className="bi bi-pencil me-2" />
                                                {intl.formatMessage({ id: 'CHANNELS.ACTION.EDIT' })}
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                className="dropdown-item text-warning"
                                                onClick={() => handleTogglePublish(c.id, !c.isPublished)}
                                            >
                                                <i className={`bi me-2 ${c.isPublished ? 'bi-toggle-off' : 'bi-toggle-on'}`} />
                                                {c.isPublished ? intl.formatMessage({ id: 'CHANNELS.ACTION.UNPUBLISH' }) : intl.formatMessage({ id: 'CHANNELS.ACTION.PUBLISH' })}
                                            </button>
                                        </li>
                                        <li>
                                            <button className="dropdown-item text-danger" onClick={() => openDeleteModal(c.id)}>
                                                <i className="bi bi-trash me-2" />
                                                {intl.formatMessage({ id: 'CHANNELS.ACTION.DELETE' })}
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )

    // render da tabela com DnD
    const renderDnDTable = () => (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="channels-droppable">
                {(prov) => (
                    <div {...prov.droppableProps} ref={prov.innerRef}>
                        <div className="table-responsive">
                            <table className="table align-middle table-row-dashed fs-6 gy-5 mb-0">
                                <thead>
                                    <tr className="text-gray-400 fw-bold">
                                        <th className="w-30px" />
                                        <th>{intl.formatMessage({ id: 'CHANNELS.TABLE.HEADER.NAME' })}</th>
                                        <th>{intl.formatMessage({ id: 'CHANNELS.TABLE.HEADER.LOCATIONS' })}</th>
                                        <th>{intl.formatMessage({ id: 'CHANNELS.TABLE.HEADER.STATUS' })}</th>
                                        <th className="text-end">{intl.formatMessage({ id: 'CHANNELS.TABLE.HEADER.ACTIONS' })}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {channels.map((c, idx) => (
                                        <Draggable key={c.id} draggableId={c.id} index={idx}>
                                            {(prov2) => (
                                                <tr ref={prov2.innerRef} {...prov2.draggableProps} style={prov2.draggableProps.style}>
                                                    <td className="pe-0">
                                                        {/* handle SEMPRE presente quando DnD está ativo */}
                                                        <span {...prov2.dragHandleProps} aria-label="Arrastar canal" title="Arrastar canal">
                                                            <i className="bi bi-list fs-3 text-muted cursor-move" />
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="fw-bold">{c.name}</div>
                                                        {metrics[c.id] && (
                                                            <div className="text-gray-600 fs-7">
                                                                {intl.formatMessage({ id: 'CHANNELS.METRICS.POSTS' })}: <strong>{metrics[c.id].postsCount}</strong> |
                                                                {intl.formatMessage({ id: 'CHANNELS.METRICS.USERS' })}: <strong>{metrics[c.id].usersCount}</strong> |
                                                                {intl.formatMessage({ id: 'CHANNELS.METRICS.SPACES' })}: <strong>{metrics[c.id].spaceNames.join(', ')}</strong>
                                                                {metrics[c.id].lastPostDate && (
                                                                    <>
                                                                        | {intl.formatMessage({ id: 'CHANNELS.METRICS.LAST' })}:{' '}
                                                                        <strong>
                                                                            {format(metrics[c.id].lastPostDate!, 'dd/MM/yyyy, HH:mm', { locale: getDateFnsLocale() })}
                                                                        </strong>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {c.spaceIds?.map((id) => {
                                                            const sp = spaces.find((s) => s.id === id)
                                                            return sp ? (
                                                                <span key={id} className="badge badge-light me-1">
                                                                    {sp.name}
                                                                </span>
                                                            ) : null
                                                        })}
                                                    </td>
                                                    <td>
                                                        {c.isPublished ? (
                                                            <span className="badge badge-success">{intl.formatMessage({ id: 'CHANNELS.STATUS.PUBLISHED' })}</span>
                                                        ) : (
                                                            <span className="badge badge-secondary">{intl.formatMessage({ id: 'CHANNELS.STATUS.UNPUBLISHED' })}</span>
                                                        )}
                                                    </td>
                                                    <td className="text-end">
                                                        <div className="dropdown">
                                                            <button className="btn btn-icon" type="button" data-bs-toggle="dropdown" aria-expanded="false" disabled>
                                                                <i className="bi bi-three-dots-vertical fs-5" />
                                                            </button>
                                                            <ul className="dropdown-menu dropdown-menu-end">
                                                                <li>
                                                                    <span className="dropdown-item disabled">
                                                                        <i className="bi bi-pencil me-2" />
                                                                        {intl.formatMessage({ id: 'CHANNELS.ACTION.EDIT' })}
                                                                    </span>
                                                                </li>
                                                                <li>
                                                                    <span className="dropdown-item disabled">
                                                                        <i className="bi bi-toggle-off me-2" />
                                                                        {intl.formatMessage({ id: 'CHANNELS.ACTION.PUBLISH' })}/{intl.formatMessage({ id: 'CHANNELS.ACTION.UNPUBLISH' })}
                                                                    </span>
                                                                </li>
                                                                <li>
                                                                    <span className="dropdown-item disabled text-danger">
                                                                        <i className="bi bi-trash me-2" />
                                                                        {intl.formatMessage({ id: 'CHANNELS.ACTION.DELETE' })}
                                                                    </span>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Draggable>
                                    ))}
                                    {prov.placeholder}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    )

    return (
        <div className="app-container container-xxl">
            <div className="app-page" id="kt_app_page">
                <div className="app-wrapper" id="kt_app_wrapper">
                    <AsideDefault />
                    <div className="app-main" id="kt_app_main">
                        <Content>
                            {/* header + botões */}
                            <div className="d-flex align-items-center justify-content-between mb-6">
                                <h2 className="fw-bold text-dark m-0">{intl.formatMessage({ id: 'CHANNELS.PAGE.TITLE' })}</h2>
                                <div>
                                    {!isReordering ? (
                                        <button
                                            className="btn btn-outline-secondary me-2"
                                            onClick={() => {
                                                setBackupChannels(channels)
                                                setIsReordering(true)
                                            }}
                                        >
                                            {intl.formatMessage({ id: 'CHANNELS.PAGE.BUTTON.REORDER' })}
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                className="btn btn-light me-2"
                                                onClick={() => {
                                                    setChannels(backupChannels)
                                                    setIsReordering(false)
                                                }}
                                            >
                                                {intl.formatMessage({ id: 'CHANNELS.PAGE.BUTTON.CANCEL' })}
                                            </button>
                                            <button
                                                className="btn btn-primary me-2"
                                                onClick={async () => {
                                                    try {
                                                        await ChannelsService.reorderChannels(
                                                            currentUser!.companyId,
                                                            channels.map((c) => c.id)
                                                        )
                                                    } finally {
                                                        setIsReordering(false)
                                                        await loadChannels()
                                                    }
                                                }}
                                            >
                                                {intl.formatMessage({ id: 'CHANNELS.PAGE.BUTTON.SAVE_ORDER' })}
                                            </button>
                                        </>
                                    )}
                                    <button className="btn btn-primary" onClick={() => openChannelModal()} disabled={isReordering}>
                                        {intl.formatMessage({ id: 'CHANNELS.PAGE.BUTTON.CREATE' })}
                                    </button>
                                </div>
                            </div>

                            {/* filtro por espaço */}
                            <div className="mb-4 d-flex align-items-center">
                                <label className="me-2 mb-0">{intl.formatMessage({ id: 'CHANNELS.PAGE.LABEL.LOCATIONS' })}</label>
                                <select
                                    className="form-select w-auto"
                                    value={spaceId ?? ''}
                                    onChange={(e) => setSpaceId(e.target.value)}
                                    disabled={isReordering}
                                >
                                    {spaces.map((sp) => (
                                        <option key={sp.id} value={sp.id}>
                                            {sp.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* tabela (com ou sem DnD) */}
                            <div className="card card-flush">
                                <div className="card-body py-0">
                                    {isReordering ? renderDnDTable() : renderPlainTable()}
                                </div>
                            </div>

                            {/* modais */}
                            {showChannelModal && (
                                <ChannelModal
                                    show={showChannelModal}
                                    onHide={closeChannelModal}
                                    channelId={editingChannelId}
                                    companyId={currentUser!.companyId}
                                    onSave={handleChannelSaved}
                                />
                            )}

                            <div className="modal fade" tabIndex={-1} ref={deleteRef}>
                                <div className="modal-dialog">
                                    <div className="modal-content p-4">
                                        <div className="modal-header">
                                            <h3 className="modal-title">{intl.formatMessage({ id: 'CHANNELS.DELETE_MODAL.TITLE' })}</h3>
                                            <div className="btn btn-icon btn-sm btn-active-light-primary ms-2" data-bs-dismiss="modal">
                                                <i className="bi bi-x fs-2" />
                                            </div>
                                        </div>
                                        <div className="modal-body">
                                            <p>{intl.formatMessage({ id: 'CHANNELS.DELETE_MODAL.BODY' })}</p>
                                        </div>
                                        <div className="modal-footer">
                                            <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                                                {intl.formatMessage({ id: 'CHANNELS.DELETE_MODAL.CANCEL' })}
                                            </button>
                                            <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                                                {intl.formatMessage({ id: 'CHANNELS.DELETE_MODAL.CONFIRM' })}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Content>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChannelsPage