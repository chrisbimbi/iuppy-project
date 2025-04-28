// frontend/src/app/modules/communication/controllers/ContentPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { AsideDefault } from 'src/layout/components/aside/AsideDefault';
import { Content } from 'src/layout/components/Content';
import { ChannelsList } from 'src/app/modules/channels/components/ChannelsList';
import ContentList from 'src/app/modules/communication/views/ContentList';
import { useAuth } from 'src/app/modules/auth';
import { useContent } from '../providers/useContent';
import { useContentActions } from '../providers/useContentActions';
import { spacesService } from 'src/app/modules/spaces/services/spaces.service';
import { channelsService } from 'src/app/modules/channels/services/channels.service';
import { ContentService } from '../services/content.service';
import ChannelModal from 'src/app/modules/channels/components/ChannelModal';
import { Modal } from 'bootstrap';
import { DrawerComponent, MenuComponent } from 'src/assets/ts/components';
import { CreateNewWrapper } from 'src/app/modules/news/components/CreateNewsWizard';
import { initialNewValues } from 'src/app/modules/news/components/helpers/initialValues';
import { CreateNewsDto } from '@shared/types';

const ContentPage: React.FC = () => {
    const { currentUser } = useAuth();

    // Estados de espaço e canais
    const [spaces, setSpaces] = useState<any[]>([]);
    const [spaceId, setSpaceId] = useState<string | null>(null);
    const [channels, setChannels] = useState<any[]>([]);
    const [channelId, setChannelId] = useState<string | null>(null);

    // Seleção múltipla na lista de conteúdos
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Controle de modais
    const [channelModalShow, setChannelModalShow] = useState(false);
    const [channelModalId, setChannelModalId] = useState<string | undefined>(undefined);
    const createPostRef = useRef<HTMLDivElement>(null);
    const [createPostModal, setCreatePostModal] = useState<Modal | null>(null);
    const [editingId, setEditingId] = useState<string | undefined>(undefined);
    const [wizardInitialValues, setWizardInitialValues] = useState<CreateNewsDto>({
        ...initialNewValues,
        channelId: channelId!,
    });

    // Hooks de dados e ações
    const { items, loading, error, refetch } = useContent({ channelId });
    const { createItem, editItem, duplicateItem, deleteItem } = useContentActions(refetch);

    // Inicia modais e Metronic
    useEffect(() => {
        if (createPostRef.current) {
            setCreatePostModal(new Modal(createPostRef.current));
        }
        MenuComponent.reinitialization();
        DrawerComponent.bootstrap();
        setTimeout(() => DrawerComponent.createInstances('#kt_stats_drawer'), 50);
    }, []);

    // Carrega spaces
    useEffect(() => {
        if (!currentUser) return;
        spacesService.list(currentUser.companyId).then(data => {
            setSpaces(data);
            if (!spaceId) setSpaceId(data[0]?.id ?? null);
        });
    }, [currentUser]);

    // Carrega channels quando space muda
    useEffect(() => {
        if (!spaceId || !currentUser) return;
        channelsService.list(currentUser.companyId, spaceId).then(data => {
            setChannels(data);
            if (!channelId) setChannelId(data[0]?.id ?? null);
        });
    }, [spaceId, currentUser]);

    // Handlers de canal
    const handleEditChannel = (id: string) => {
        setChannelModalId(id);
        setChannelModalShow(true);
    };
    const handleCreateChannel = () => {
        handleEditChannel(undefined!);
    };

    // Handlers de conteúdo
    const handleCreatePost = (chId: string) => {
        setEditingId(undefined);
        setWizardInitialValues({ ...initialNewValues, channelId: chId });
        createPostModal?.show();
    };
    const handleEditContent = async (id: string) => {
        const original = await ContentService.get(id);
        setEditingId(id);
        setWizardInitialValues({
            title: original.title,
            subtitle: original.subtitle,
            content: original.content,
            type: original.type,
            authorId: original.authorId,
            companyId: original.companyId!,
            channelId: original.channelId,
            isPublished: original.isPublished,
            attachments: original.attachments.map(url => ({ url, name: url.split('/').pop()! })),
            highlightImages: original.highlightImages.map(url => ({ url, name: url.split('/').pop()! })),
            settings: { ...original.settings },
        });
        createPostModal?.show();
    };
    const handleSaved = () => {
        createPostModal?.hide();
        refetch();
    };
    const handleSelect = (id: string, checked: boolean) => {
        setSelectedIds(prev => (checked ? [...prev, id] : prev.filter(x => x !== id)));
    };

    return (
        <div className="app-container container-xxl">
            <div className="app-page flex-column flex-row-fluid" id="kt_app_page">
                <div className="app-wrapper flex-column flex-row-fluid" id="kt_app_wrapper">
                    <AsideDefault />
                    <div className="app-main flex-column flex-row-fluid" id="kt_app_main">
                        <Content>
                            <div className="row">
                                {/* Sidebar de canais */}
                                <div className="col-lg-4">
                                    <ChannelsList
                                        channels={channels}
                                        selectedChannelId={channelId}
                                        onChannelSelect={setChannelId}
                                        onChannelReorder={() => { }}
                                        onCreateChannel={handleCreateChannel}
                                        onEditChannel={id => handleEditChannel(id)}
                                        onCreatePost={handleCreatePost}
                                    />
                                </div>
                                {/* Lista de conteúdos */}
                                <div className="col-lg-8">
                                    <ContentList
                                        channelName={channels.find(c => c.id === channelId)?.name ?? null}
                                        onEditChannel={() => handleEditChannel(channelId!)}
                                        onCreatePost={() => handleCreatePost(channelId!)}
                                        items={items}
                                        loading={loading}
                                        error={error}
                                        selectedIds={selectedIds}
                                        onSelect={handleSelect}
                                        onEdit={handleEditContent}
                                        onDuplicate={duplicateItem}
                                        onDelete={deleteItem}
                                    />
                                </div>
                            </div>

                            {/* Modal de criação/edição */}
                            <div className="modal fade modal-xl" tabIndex={-1} ref={createPostRef}>
                                <div className="modal-dialog modal-fullscreen-lg-down">
                                    <div className="modal-content">
                                        <CreateNewWrapper
                                            initialValues={wizardInitialValues}
                                            editingId={editingId}
                                            onSaved={handleSaved}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal de canal */}
                            <ChannelModal
                                show={channelModalShow}
                                onHide={() => setChannelModalShow(false)}
                                channelId={channelModalId}
                                companyId={currentUser!.companyId}
                                onSave={() =>
                                    channelsService
                                        .list(currentUser!.companyId, spaceId!)
                                        .then(data => setChannels(data))
                                }
                            />
                        </Content>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContentPage;