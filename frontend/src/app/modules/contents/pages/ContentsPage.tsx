// src/app/modules/contents/pages/ContentsPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { AsideDefault } from 'src/layout/components/aside/AsideDefault';
import { Content } from 'src/layout/components/Content';
import { ChannelsList } from '../../channels/components/ChannelsList';
import { ContentsList } from '../components/ContentsList';
import { DrawerComponent, MenuComponent } from 'src/assets/ts/components';
import { useAuth } from '../../auth';
import { useNews } from '../../news/hooks/useNews';
import { spacesService } from '../../spaces/services/spaces.service';
import { channelsService } from '../../channels/services/channels.service';
import { Modal } from 'bootstrap';
import { initialNewValues } from '../../news/components/helpers/initialValues';
import ChannelModal from '../../channels/components/ChannelModal';
import { CreateNewWrapper } from '../../news/components/CreateNewsWizard';
import { CreateNewsDto } from '@shared/types';
import { NewsService } from '../../news/services/news.service';

export const ContentsPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [spaces, setSpaces] = useState<any[]>([]);
    const [channels, setChannels] = useState<any[]>([]);
    const [selSpace, setSelSpace] = useState<string | null>(null);
    const [selChan, setSelChan] = useState<string | null>(null);
    const { news, loading, error, refetch } = useNews({ channelId: selChan });
    const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([]);
    const [channelModalShow, setChannelModalShow] = useState(false);
    const [channelModalId, setChannelModalId] = useState<string | undefined>(undefined);
    const createPostRef = useRef<HTMLDivElement>(null);
    const [createPostModal, setCreatePostModal] = useState<Modal | null>(null);
    const [editingId, setEditingId] = useState<string | undefined>(undefined);
    const [wizardInitialValues, setWizardInitialValues] = useState<CreateNewsDto>({
        ...initialNewValues,
        channelId: selChan!,
    });

    useEffect(() => {
        if (createPostRef.current) {
            setCreatePostModal(new Modal(createPostRef.current));
        }
        DrawerComponent.bootstrap();
        setTimeout(() => DrawerComponent.createInstances('#kt_stats_drawer'), 50);
    }, []);

    useEffect(() => {
        if (!currentUser) return;
        spacesService.list(currentUser.companyId).then(data => {
            setSpaces(data);
            if (!selSpace) setSelSpace(data[0]?.id ?? null);
        });
    }, [currentUser]);

    useEffect(() => {
        if (!selSpace) return;
        if (!currentUser) return;
        channelsService.list(currentUser.companyId, selSpace).then(data => {
            setChannels(data);
            if (!selChan) setSelChan(data[0]?.id ?? null);
        });
    }, [selSpace]);

    const handleCreatePost = () => {
        setEditingId(undefined);
        setWizardInitialValues({ ...initialNewValues, channelId: selChan! });
        createPostModal!.show();
    };

    const handleEditChannel = (id: string) => {
        setChannelModalId(id);
        setChannelModalShow(true);
    };

    const reloadChannels = () => {
        if (!selSpace) return;
        if (currentUser) {
            channelsService.list(currentUser.companyId, selSpace).then(data => setChannels(data));
        }
        setChannelModalShow(false);
    };

    const handleEditNews = async (id: string) => {
        try {
            const item = await NewsService.getNew(id);
            const dto = {
                title: item.title,
                subtitle: item.subtitle,
                content: item.content,
                type: item.type,
                authorId: String(currentUser!.id),
                companyId: currentUser!.companyId,
                channelId: item.channelId,
                isPublished: item.isPublished,
                attachments: item.attachments.map(url => ({ url, name: url.split('/').pop()! })),
                highlightImages: item.highlightImages.map(url => ({ url, name: url.split('/').pop()! })),
                settings: { ...item.settings },
            };
            setEditingId(id);
            setWizardInitialValues(dto);
            createPostModal!.show();
        } catch {
            alert('Erro ao carregar conteúdo para edição.');
        }
    };

    const handleDeleteNews = async (id: string) => {
        if (!confirm('Confirma a exclusão deste conteúdo?')) return;
        try {
            await NewsService.deleteNew(id);
            refetch();
        } catch {
            alert('Erro ao deletar.');
        }
    };

    const handleDuplicateNews = async (id: string) => {
        try {
            const original = news.find(n => n.id === id);
            if (!original) throw new Error();
            const dto = {
                ...initialNewValues,
                title: original.title + ' (Cópia)',
                subtitle: original.subtitle,
                content: original.content,
                type: original.type,
                authorId: String(currentUser!.id),
                companyId: currentUser!.companyId,
                channelId: original.channelId,
                isPublished: false,
                attachments: original.attachments.map(url => ({ url, name: url.split('/').pop()! })),
                highlightImages: original.highlightImages.map(url => ({ url, name: url.split('/').pop()! })),
                settings: { ...original.settings },
            };
            await NewsService.createNew(dto);
            refetch();
            alert('Duplicado com sucesso!');
        } catch {
            alert('Erro ao duplicar.');
        }
    };

    const handleSelect = (id: string, checked: boolean) =>
        setSelectedNewsIds(prev => (checked ? [...prev, id] : prev.filter(x => x !== id)));

    return (
        <div className="app-container container-xxl">
            <div className="app-page flex-column flex-row-fluid" id="kt_app_page">
                <div className="app-wrapper flex-column flex-row-fluid" id="kt_app_wrapper">
                    <AsideDefault />
                    <div className="app-main flex-column flex-row-fluid" id="kt_app_main">
                        <Content>
                            <div className="row">
                                <div className="col-lg-4">
                                    <ChannelsList
                                        channels={channels}
                                        selectedChannelId={selChan}
                                        onChannelSelect={setSelChan}
                                        onCreateChannel={() => setChannelModalShow(true)}
                                        onEditChannel={handleEditChannel}
                                        onChannelReorder={() => { }}
                                        onCreatePost={handleCreatePost}
                                    />
                                </div>
                                <div className="col-lg-8">
                                    <ContentsList
                                        channelName={channels.find(c => c.id === selChan)?.name ?? null}
                                        onEditChannel={handleCreatePost}
                                        onCreatePost={handleCreatePost}
                                        items={news}
                                        loading={loading}
                                        error={error}
                                        selectedIds={selectedNewsIds}
                                        onSelect={handleSelect}
                                        onEdit={handleEditNews}
                                        onDelete={handleDeleteNews}
                                        onDuplicate={handleDuplicateNews}
                                    />
                                </div>
                            </div>
                            <ChannelModal
                                show={channelModalShow}
                                onHide={() => setChannelModalShow(false)}
                                channelId={channelModalId}
                                companyId={currentUser!.companyId}
                                onSave={reloadChannels}
                            />
                            <div className="modal fade modal-xl" tabIndex={-1} ref={createPostRef} id="kt_modal_create_content">
                                <div className="modal-dialog modal-fullscreen-lg-down">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">
                                                {editingId
                                                    ? `Editar conteúdo para o canal “${channels.find(c => c.id === selChan)?.name}”`
                                                    : `Criar novo conteúdo para o canal “${channels.find(c => c.id === selChan)?.name}”`}
                                            </h5>
                                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                                        </div>
                                        <div className="modal-body">
                                            <CreateNewWrapper
                                                initialValues={wizardInitialValues}
                                                editingId={editingId}
                                                onSaved={() => { createPostModal!.hide(); refetch(); }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Drawer for content statistics */}
                            <div
                                id="kt_stats_drawer"
                                className="bg-body drawer drawer-end"
                                data-drawer="true"
                                data-drawer-activate="true"
                                data-drawer-overlay="true"
                                data-drawer-width="{default:'300px', 'md':'500px'}"
                                data-drawer-direction="end"
                            >
                                <div className="drawer-header pe-5">
                                    <h3 className="drawer-title"></h3>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-icon btn-active-light-primary ms-2"
                                        data-drawer-dismiss="true"
                                    >
                                        <i className="bi bi-x fs-2"></i>
                                    </button>
                                </div>
                                <div className="drawer-body px-5 pb-10">
                                    {/* Estatísticas serão carregadas aqui */}
                                    <div id="kt_stats_chart"></div>
                                </div>
                            </div>
                        </Content>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContentsPage;