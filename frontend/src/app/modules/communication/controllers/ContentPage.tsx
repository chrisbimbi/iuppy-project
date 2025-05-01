import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const navigate = useNavigate();

  const [spaces, setSpaces] = useState<any[]>([]);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const deleteRef = useRef<HTMLDivElement>(null);
  const [formModal, setFormModal] = useState<Modal | null>(null);
  const [deleteModal, setDeleteModal] = useState<Modal | null>(null);

  const [editingId, setEditingId] = useState<string>();
  const [wizardInitialValues, setWizardInitialValues] =
    useState<CreateContentDto>({ ...initialNewValues, channelId: '' });

  const [toDeleteIds, setToDeleteIds] = useState<string[]>([]);

  const { items, loading, error, refetch } = useContent({ channelId });
  const {
    createItem,
    editItem,
    duplicateItem,
    deleteItem,
    togglePublishItems,
  } = useContentActions(refetch);

  useEffect(() => {
    if (formRef.current) setFormModal(new Modal(formRef.current));
    if (deleteRef.current) setDeleteModal(new Modal(deleteRef.current));
    MenuComponent.reinitialization();
    DrawerComponent.bootstrap();
    setTimeout(() => DrawerComponent.createInstances('#kt_stats_drawer'), 50);
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const sp = p.get('spaceId');
    const ch = p.get('channelId');
    if (sp && sp !== spaceId) setSpaceId(sp);
    if (ch && ch !== channelId) setChannelId(ch);
  }, [location.search]);

  useEffect(() => {
    if (!currentUser) return;
    spacesService.list(currentUser.companyId).then(data => {
      setSpaces(data);
      if (!spaceId && data.length) {
        setSpaceId(data[0].id);
      }
    });
  }, [currentUser]);

  useEffect(() => {
    if (!spaceId || !currentUser) return;
    channelsService.list(currentUser.companyId, spaceId).then(data => {
      setChannels(data);
      if (!channelId && data.length) {
        setChannelId(data[0].id);
      }
    });
  }, [spaceId, currentUser]);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (spaceId) qs.set('spaceId', spaceId);
    if (channelId) qs.set('channelId', channelId);
    navigate({ pathname: '/contents', search: qs.toString() }, { replace: true });
  }, [spaceId, channelId]);

  const handleSaved = () => {
    formModal?.hide();
    refetch();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleCreatePost = (chId: string) => {
    setEditingId(undefined);
    setWizardInitialValues({
      ...initialNewValues,
      channelId: chId,
      authorId: String(currentUser!.id),
      companyId: currentUser!.companyId,
    });
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
      companyId: original.companyId!,
      isPublished: original.isPublished,
      attachments: (original.attachments ?? [])
        .filter(u => u)
        .map(u => ({ url: u, name: u.split('/').pop()! })),
      highlightImages: (original.highlightImages ?? [])
        .filter(u => u)
        .map(u => ({ url: u, name: u.split('/').pop()! })),
      settings: { ...original.settings },
    });
    formModal?.show();
  };

  const handleSelect = (id: string, checked: boolean) =>
    setSelectedIds(prev => (checked ? [...prev, id] : prev.filter(x => x !== id)));

  const handleDeleteContent = (id: string) => {
    setToDeleteIds([id]);
    deleteModal?.show();
  };
  const handleDeleteMultiple = () => {
    setToDeleteIds([...selectedIds]);
    deleteModal?.show();
  };
  const handleConfirmDelete = async () => {
    await Promise.all(toDeleteIds.map(id => deleteItem(id)));
    setSelectedIds(prev => prev.filter(id => !toDeleteIds.includes(id)));
    deleteModal?.hide();
  };

  const handleDuplicateMultiple = async () => {
    await Promise.all(selectedIds.map(id => duplicateItem(id)));
    setSelectedIds([]);
  };
  const handleTogglePublishMultiple = async () => {
    await togglePublishItems(selectedIds);
    setSelectedIds([]);
  };

  const currentSpaceName = spaces.find(s => s.id === spaceId)?.name ?? 'Conteúdos';

  return (
    <div className="app-container container-xxl">
      <div className="app-page" id="kt_app_page">
        <div className="app-wrapper" id="kt_app_wrapper">
          <AsideDefault />
          <div className="app-main" id="kt_app_main">
            <Content>
              <div className="d-flex align-items-center justify-content-between mb-6">
                <h2 className="fw-bold text-dark m-0">
                  Espaço: <span className="text-primary">{currentSpaceName}</span>
                </h2>
              </div>

              {success && (
                <div className="alert alert-success">
                  Ação realizada com sucesso!
                </div>
              )}

              <div className="row">
                <div className="col-lg-4">
                  <ChannelsList
                    channels={channels}
                    selectedChannelId={channelId}
                    onChannelSelect={setChannelId}
                    onCreateChannel={() => {}}
                    onEditChannel={() => {}}
                    onChannelReorder={() => {}}
                    onCreatePost={handleCreatePost}
                  />
                </div>
                <div className="col-lg-8">
                  <ContentList
                    channelName={channels.find(c => c.id === channelId)?.name ?? null}
                    onEditChannel={() => channelId && console.log('editar canal', channelId)}
                    onCreatePost={() => channelId && handleCreatePost(channelId)}
                    items={items}
                    loading={loading}
                    error={error}
                    selectedIds={selectedIds}
                    onSelect={handleSelect}
                    onEdit={handleEditContent}
                    onDuplicate={duplicateItem}
                    onDelete={handleDeleteContent}
                    onDeleteMultiple={handleDeleteMultiple}
                    onDuplicateMultiple={handleDuplicateMultiple}
                    onTogglePublishMultiple={handleTogglePublishMultiple}
                  />
                </div>
              </div>

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

              <div className="modal fade" tabIndex={-1} ref={deleteRef} id="kt_modal_delete">
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3 className="modal-title">Confirmação de exclusão</h3>
                      <div
                        className="btn btn-icon btn-sm btn-active-light-primary ms-2"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                      >
                        <i className="bi bi-x fs-2"></i>
                      </div>
                    </div>
                    <div className="modal-body">
                      <p>
                        Tem certeza que deseja excluir{' '}
                        {toDeleteIds.length > 1
                          ? `${toDeleteIds.length} conteúdos`
                          : 'este conteúdo'}
                        ? Esta ação não poderá ser desfeita.
                      </p>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-light"
                        data-bs-dismiss="modal"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={handleConfirmDelete}
                      >
                        Excluir
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
  );
};

export default ContentPage;