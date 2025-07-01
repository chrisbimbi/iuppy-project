import React, { useEffect, useRef, useState } from 'react';
import { AsideDefault } from 'src/layout/components/aside/AsideDefault';
import { Content } from 'src/layout/components/Content';
import { useAuth } from 'src/app/modules/auth';
import { spacesService } from 'src/app/modules/spaces/services/spaces.service';
import { ChannelsService } from 'src/app/modules/channels/services/channels.service';
import { ContentService } from 'src/app/modules/communication/services/content.service';
import { Channel } from '@shared/types/Channel';
import ChannelModal from 'src/app/modules/channels/components/ChannelModal';
import { Modal } from 'bootstrap';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UsersService } from '../../users/services/users.service';
import { User } from '@shared/types';

interface Metrics {
    postsCount: number;
    usersCount: number;
    spaceNames: string[];
    lastPostDate: Date | null;
}

const ChannelsPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [spaces, setSpaces] = useState<any[]>([]);
    const [spaceId, setSpaceId] = useState<string | null>(null);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [metrics, setMetrics] = useState<Record<string, Metrics>>({});
    const [allUsers, setAllUsers] = useState<User[]>([]);

    // reordering state
    const [isReordering, setIsReordering] = useState(false);
    const [backupChannels, setBackupChannels] = useState<Channel[]>([]);

    // modais create/edit & delete
    const [showChannelModal, setShowChannelModal] = useState(false);
    const [editingChannelId, setEditingChannelId] = useState<string>();
    const deleteRef = useRef<HTMLDivElement>(null);
    const [deleteModal, setDeleteModal] = useState<Modal | null>(null);
    const [toDeleteChannelId, setToDeleteChannelId] = useState<string>();

    // carrega usuários
    useEffect(() => {
        if (!currentUser) return;
        UsersService.list(currentUser.companyId).then(setAllUsers);
    }, [currentUser]);

    // carrega espaços
    useEffect(() => {
        if (!currentUser) return;
        spacesService.list(currentUser.companyId).then(list => {
            setSpaces(list);
            if (!spaceId && list.length) setSpaceId(list[0].id);
        });
    }, [currentUser]);

    // carrega canais
    const loadChannels = () => {
        if (!currentUser || !spaceId) return;
        ChannelsService.list(currentUser.companyId, spaceId).then(setChannels);
    };
    useEffect(loadChannels, [currentUser, spaceId]);

    // modal delete
    useEffect(() => {
        if (deleteRef.current) setDeleteModal(new Modal(deleteRef.current));
    }, []);

    // métricas
    useEffect(() => {
        if (!channels.length) return;
        (async () => {
            const m: Record<string, Metrics> = {};
            for (const c of channels) {
                const [postsCount, latest, spacesInfo] = await Promise.all([
                    ContentService.countByChannel(c.id),
                    ContentService.getLatestByChannel(c.id),
                    spacesService.getByIds(c.spaceIds || []),
                ]);
                m[c.id] = {
                    postsCount,
                    usersCount: allUsers.length,
                    spaceNames: spacesInfo.map(s => s.name),
                    lastPostDate: latest?.createdAt ? new Date(latest.createdAt) : null,
                };
            }
            setMetrics(m);
        })();
    }, [channels, allUsers]);

    // open/close create-edit modal
    const openChannelModal = (id?: string) => {
        setEditingChannelId(id);
        setShowChannelModal(true);
    };
    const closeChannelModal = () => setShowChannelModal(false);
    const handleChannelSaved = () => {
        closeChannelModal();
        loadChannels();
    };

    // delete
    const openDeleteModal = (id: string) => {
        setToDeleteChannelId(id);
        deleteModal?.show();
    };
    const confirmDelete = async () => {
        if (toDeleteChannelId) {
            await ChannelsService.deleteChannel(toDeleteChannelId);
            loadChannels();
        }
        deleteModal?.hide();
    };

    // toggle publish
    const handleTogglePublish = async (id: string, publish: boolean) => {
        if (!currentUser) return;
        const ch = channels.find(x => x.id === id);
        if (!ch) return;
        await ChannelsService.updateChannel(id, {
            name: ch.name,
            description: ch.description || '',
            type: ch.type!,
            companyId: currentUser.companyId,
            spaceIds: ch.spaceIds || [],
            groupIds: ch.groupIds || [],
            contributorIds: ch.contributorIds || [],
            adminIds: ch.adminIds || [],
            isPublished: publish,
        });
        loadChannels();
    };

    // DnD
    const handleDragEnd = (result: DropResult) => {
        if (!isReordering) return;
        if (!result.destination) return;
        const next = Array.from(channels);
        const [moved] = next.splice(result.source.index, 1);
        next.splice(result.destination.index, 0, moved);
        setChannels(next);
    };

    return (
        <div className="app-container container-xxl">
            <div className="app-page" id="kt_app_page">
                <div className="app-wrapper" id="kt_app_wrapper">
                    <AsideDefault />
                    <div className="app-main" id="kt_app_main">
                        <Content>
                            {/* header + botões */}
                            <div className="d-flex align-items-center justify-content-between mb-6">
                                <h2 className="fw-bold text-dark m-0">Canais</h2>
                                <div>
                                    {!isReordering ? (
                                        <button
                                            className="btn btn-outline-secondary me-2"
                                            onClick={() => {
                                                setBackupChannels(channels);
                                                setIsReordering(true);
                                            }}
                                        >
                                            Reordenar canais
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                className="btn btn-light me-2"
                                                onClick={() => {
                                                    setChannels(backupChannels);
                                                    setIsReordering(false);
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                className="btn btn-primary me-2"
                                                onClick={async () => {
                                                    await ChannelsService.reorderChannels(
                                                        currentUser!.companyId,
                                                        channels.map(c => c.id),
                                                    );
                                                    setIsReordering(false);
                                                }}
                                            >
                                                Salvar nova ordem
                                            </button>
                                        </>
                                    )}
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => openChannelModal()}
                                        disabled={isReordering}
                                    >
                                        Criar canal
                                    </button>
                                </div>
                            </div>

                            {/* filtro por espaço */}
                            <div className="mb-4 d-flex align-items-center">
                                <label className="me-2 mb-0">Locais:</label>
                                <select
                                    className="form-select w-auto"
                                    value={spaceId!}
                                    onChange={e => setSpaceId(e.target.value)}
                                    disabled={isReordering}
                                >
                                    {spaces.map(sp => (
                                        <option key={sp.id} value={sp.id}>{sp.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* tabela + DnD */}
                            <div className="card card-flush">
                                <div className="card-body py-0">
                                    <DragDropContext onDragEnd={handleDragEnd}>
                                        <Droppable droppableId="channels">
                                            {prov => (
                                                <div {...prov.droppableProps} ref={prov.innerRef}>
                                                    <div className="table-responsive">
                                                        <table className="table align-middle table-row-dashed fs-6 gy-5 mb-0">
                                                            <thead>
                                                                <tr className="text-gray-400 fw-bold">
                                                                    <th className="w-30px"></th>
                                                                    <th>Nome</th>
                                                                    <th>Locais</th>
                                                                    <th>Status</th>
                                                                    <th className="text-end">Ações</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {channels.map((c, idx) => (
                                                                    <Draggable key={c.id} draggableId={c.id} index={idx}>
                                                                        {prov2 => (
                                                                            <tr
                                                                                ref={prov2.innerRef}
                                                                                {...prov2.draggableProps}
                                                                                style={prov2.draggableProps.style}
                                                                            >
                                                                                <td className="pe-0">
                                                                                    {isReordering && (
                                                                                        <span {...prov2.dragHandleProps}>
                                                                                            <i className="bi bi-list fs-3 text-muted cursor-move"></i>
                                                                                        </span>
                                                                                    )}
                                                                                </td>
                                                                                <td>
                                                                                    <div className="fw-bold">{c.name}</div>
                                                                                    {metrics[c.id] && (
                                                                                        <div className="text-gray-600 fs-7">
                                                                                            Posts: <strong>{metrics[c.id].postsCount}</strong> |
                                                                                            Usuários: <strong>{metrics[c.id].usersCount}</strong> |
                                                                                            Espaço(s): <strong>{metrics[c.id].spaceNames.join(', ')}</strong>
                                                                                            {metrics[c.id].lastPostDate && (
                                                                                                <> | Última: <strong>
                                                                                                    {format(
                                                                                                        metrics[c.id].lastPostDate!,
                                                                                                        'dd/MM/yyyy, HH:mm',
                                                                                                        { locale: ptBR },
                                                                                                    )}
                                                                                                </strong></>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </td>
                                                                                <td>
                                                                                    {c.spaceIds?.map(id => {
                                                                                        const sp = spaces.find(s => s.id === id);
                                                                                        return sp ? (
                                                                                            <span key={id} className="badge badge-light me-1">
                                                                                                {sp.name}
                                                                                            </span>
                                                                                        ) : null;
                                                                                    })}
                                                                                </td>
                                                                                <td>
                                                                                    {c.isPublished
                                                                                        ? <span className="badge badge-success">Publicado</span>
                                                                                        : <span className="badge badge-secondary">Despublicado</span>}
                                                                                </td>
                                                                                <td className="text-end">
                                                                                    <div className="dropdown">
                                                                                        <button
                                                                                            className="btn btn-icon"
                                                                                            type="button"
                                                                                            data-bs-toggle="dropdown"
                                                                                            aria-expanded="false"
                                                                                            disabled={isReordering}
                                                                                        >
                                                                                            <i className="bi bi-three-dots-vertical fs-5"></i>
                                                                                        </button>
                                                                                        <ul className="dropdown-menu dropdown-menu-end">
                                                                                            <li>
                                                                                                <button
                                                                                                    className="dropdown-item"
                                                                                                    onClick={() => openChannelModal(c.id)}
                                                                                                    disabled={isReordering}
                                                                                                >
                                                                                                    <i className="bi bi-pencil me-2"></i>Editar
                                                                                                </button>
                                                                                            </li>
                                                                                            <li>
                                                                                                <button
                                                                                                    className="dropdown-item text-warning"
                                                                                                    onClick={() => handleTogglePublish(c.id, !c.isPublished)}
                                                                                                    disabled={isReordering}
                                                                                                >
                                                                                                    <i className={`bi me-2 ${c.isPublished ? 'bi-toggle-off' : 'bi-toggle-on'}`}></i>
                                                                                                    {c.isPublished ? 'Despublicar' : 'Publicar'}
                                                                                                </button>
                                                                                            </li>
                                                                                            <li>
                                                                                                <button
                                                                                                    className="dropdown-item text-danger"
                                                                                                    onClick={() => openDeleteModal(c.id)}
                                                                                                    disabled={isReordering}
                                                                                                >
                                                                                                    <i className="bi bi-trash me-2"></i>Apagar
                                                                                                </button>
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
                                            <h3 className="modal-title">Confirmação de exclusão</h3>
                                            <div className="btn btn-icon btn-sm btn-active-light-primary ms-2" data-bs-dismiss="modal">
                                                <i className="bi bi-x fs-2"></i>
                                            </div>
                                        </div>
                                        <div className="modal-body">
                                            <p>Tem certeza que deseja excluir este canal? Esta ação não poderá ser desfeita.</p>
                                        </div>
                                        <div className="modal-footer">
                                            <button type="button" className="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                                            <button type="button" className="btn btn-danger" onClick={confirmDelete}>Confirmar exclusão</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </Content>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChannelsPage;