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
import { CreateNewsDto as CreateContentDto } from '@shared/types';
import { Modal } from 'bootstrap';
import { DrawerComponent, MenuComponent } from 'src/assets/ts/components';
import { initialNewValues } from '../views/ContentForm/helpers/initialValues';
import ContentForm from '../views/ContentForm/views/ContentForm';

const ContentPage: React.FC = () => {
    const { currentUser } = useAuth();

    const [spaces, setSpaces] = useState<any[]>([]);
    const [spaceId, setSpaceId] = useState<string | null>(null);
    const [channels, setChannels] = useState<any[]>([]);
    const [channelId, setChannelId] = useState<string | null>(null);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // success alert state
    const [success, setSuccess] = useState(false);

    // channel modal
    const [channelModalShow, setChannelModalShow] = useState(false);
    const [channelModalId, setChannelModalId] = useState<string>();

    // content form modal
    const formRef = useRef<HTMLDivElement>(null);
    const [formModal, setFormModal] = useState<Modal | null>(null);
    const [editingId, setEditingId] = useState<string>();
    const [wizardInitialValues, setWizardInitialValues] = useState<CreateContentDto>({
        ...initialNewValues,
        channelId: channelId!,
    });

    // data hooks
    const { items, loading, error, refetch } = useContent({ channelId });
    const { createItem, editItem, duplicateItem, deleteItem } = useContentActions(refetch);

    // callback after successful save: hide modal, refresh list & show alert
    const handleSaved = () => {
        formModal?.hide();
        refetch();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    // init metronic and modal
    useEffect(() => {
        if (formRef.current) {
            setFormModal(new Modal(formRef.current));
        }
        MenuComponent.reinitialization();
        DrawerComponent.bootstrap();
        setTimeout(() => DrawerComponent.createInstances('#kt_stats_drawer'), 50);
    }, []);

    // load spaces
    useEffect(() => {
        if (!currentUser) return;
        spacesService.list(currentUser.companyId).then(data => {
            setSpaces(data);
            if (!spaceId) setSpaceId(data[0]?.id ?? null);
        });
    }, [currentUser]);

    // load channels
    useEffect(() => {
        if (!spaceId || !currentUser) return;
        channelsService.list(currentUser.companyId, spaceId).then(data => {
            setChannels(data);
            if (!channelId) setChannelId(data[0]?.id ?? null);
        });
    }, [spaceId, currentUser]);

    // handlers
    const handleCreateChannel = () => setChannelModalShow(true);
    const handleEditChannel = (id: string) => {
        setChannelModalId(id);
        setChannelModalShow(true);
    };

    const handleCreatePost = (chId: string) => {
      
        setEditingId(undefined);
        setWizardInitialValues({
            ...initialNewValues,
            channelId: chId,
            authorId: String(currentUser!.id),
            companyId: currentUser!.companyId,
        });
        console.log('companyId', currentUser!.companyId);
        console.log('authorId', currentUser!.id);
        formModal?.show();
    };

    const handleEditContent = async (id: string) => {
        const original = await ContentService.get(id);
        setEditingId(id);
        setWizardInitialValues({
            title: original.title,
            subtitle: original.subtitle,
            content: original.content,
            type: original.type,
            channelId: original.channelId,
            authorId: original.authorId,
            companyId: original.companyId!,   // já vinha correto
            isPublished: original.isPublished,
            attachments: original.attachments.map(url => ({ url, name: url.split('/').pop()! })),
            highlightImages: original.highlightImages.map(url => ({ url, name: url.split('/').pop()! })),
            settings: { ...original.settings },
        });
        formModal?.show();
    };

    const handleSelect = (id: string, checked: boolean) =>
        setSelectedIds(prev => (checked ? [...prev, id] : prev.filter(x => x !== id)));

    return (
        <div className="app-container container-xxl">
            <div className="app-page flex-column flex-row-fluid" id="kt_app_page">
                <div className="app-wrapper flex-column flex-row-fluid" id="kt_app_wrapper">
                    <AsideDefault />
                    <div className="app-main flex-column flex-row-fluid" id="kt_app_main">
                        <Content>
                            {success && (
                                <div className="alert alert-success">
                                    Comunicado salvo com sucesso!
                                </div>
                            )}
                            <div className="row">
                                <div className="col-lg-4">
                                    <ChannelsList
                                        channels={channels}
                                        selectedChannelId={channelId}
                                        onChannelSelect={setChannelId}
                                        onCreateChannel={handleCreateChannel}
                                        onEditChannel={handleEditChannel}
                                        onChannelReorder={() => { }}
                                        onCreatePost={handleCreatePost}
                                    />
                                </div>
                                <div className="col-lg-8">
                                    <ContentList
                                        channelName={channels.find(c => c.id === channelId)?.name ?? null}
                                        onEditChannel={() => channelId && handleEditChannel(channelId)}
                                        onCreatePost={() => channelId && handleCreatePost(channelId)}
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

                            {/* ContentForm modal */}
                            <div className="modal fade modal-xl" tabIndex={-1} ref={formRef}>
                                <div className="modal-dialog modal-fullscreen-lg-down">
                                    <div className="modal-content">
                                        <ContentForm
                                            initialValues={wizardInitialValues}
                                            editingId={editingId}
                                            onSaved={handleSaved}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ChannelModal aqui */}
                        </Content>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContentPage;