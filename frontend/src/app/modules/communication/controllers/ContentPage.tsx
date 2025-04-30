// frontend/src/app/modules/communication/controllers/ContentPage.tsx
import React, { useEffect, useRef, useState } from 'react'
import { AsideDefault } from 'src/layout/components/aside/AsideDefault'
import { Content } from 'src/layout/components/Content'
import { ChannelsList } from 'src/app/modules/channels/components/ChannelsList'
import ContentList from 'src/app/modules/communication/views/ContentList'
import { useAuth } from 'src/app/modules/auth'
import { useContent } from '../providers/useContent'
import { useContentActions } from '../providers/useContentActions'
import { spacesService } from 'src/app/modules/spaces/services/spaces.service'
import { channelsService } from 'src/app/modules/channels/services/channels.service'
import { ContentService } from '../services/content.service'
import { CreateNewsDto as CreateContentDto } from '@shared/types'
import { Modal } from 'bootstrap'
import { DrawerComponent, MenuComponent } from 'src/assets/ts/components'
import { initialNewValues } from '../views/ContentForm/helpers/initialValues'
import ContentForm from '../views/ContentForm/views/ContentForm'

const ContentPage: React.FC = () => {
  const { currentUser } = useAuth()

  // estados básicos
  const [spaces, setSpaces] = useState<any[]>([])
  const [spaceId, setSpaceId] = useState<string | null>(null)
  const [channels, setChannels] = useState<any[]>([])
  const [channelId, setChannelId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [success, setSuccess] = useState(false)

  // modal de form
  const formRef = useRef<HTMLDivElement>(null)
  const [formModal, setFormModal] = useState<Modal | null>(null)
  const [editingId, setEditingId] = useState<string>()
  const [wizardInitialValues, setWizardInitialValues] = useState<CreateContentDto>({
    ...initialNewValues,
    channelId: channelId!,
  })

  // modal de delete
  const deleteRef = useRef<HTMLDivElement>(null)
  const [deleteModal, setDeleteModal] = useState<Modal | null>(null)
  const [toDeleteIds, setToDeleteIds] = useState<string[]>([])

  // dados & ações
  const { items, loading, error, refetch } = useContent({ channelId })
  const {
    createItem,
    editItem,
    duplicateItem,
    deleteItem,
    togglePublishItems,
  } = useContentActions(refetch)

  // após salvar
  const handleSaved = () => {
    formModal?.hide()
    refetch()
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  // init Metronic + modals
  useEffect(() => {
    if (formRef.current) setFormModal(new Modal(formRef.current))
    if (deleteRef.current) setDeleteModal(new Modal(deleteRef.current))
    MenuComponent.reinitialization()
    DrawerComponent.bootstrap()
    setTimeout(() => DrawerComponent.createInstances('#kt_stats_drawer'), 50)
  }, [])

  // carregar spaces e channels
  useEffect(() => {
    if (!currentUser) return
    spacesService.list(currentUser.companyId).then(data => {
      setSpaces(data)
      if (!spaceId) setSpaceId(data[0]?.id ?? null)
    })
  }, [currentUser])
  useEffect(() => {
    if (!spaceId || !currentUser) return
    channelsService.list(currentUser.companyId, spaceId).then(data => {
      setChannels(data)
      if (!channelId) setChannelId(data[0]?.id ?? null)
    })
  }, [spaceId, currentUser])

  // abrir modal de criação
  const handleCreatePost = (chId: string) => {
    setEditingId(undefined)
    setWizardInitialValues({
      ...initialNewValues,
      channelId: chId,
      authorId: String(currentUser!.id),
      companyId: currentUser!.companyId,
    })
    formModal?.show()
  }

  // abrir modal de edição, filtrando URLs nulas
  const handleEditContent = async (id: string) => {
    const original = await ContentService.get(id)
    setEditingId(id)
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
    })
    formModal?.show()
  }

  // seleção individual
  const handleSelect = (id: string, checked: boolean) =>
    setSelectedIds(prev => (checked ? [...prev, id] : prev.filter(x => x !== id)))

  // acionar modal de delete single
  const handleDeleteContent = (id: string) => {
    setToDeleteIds([id])
    deleteModal?.show()
  }
  // acionar modal de delete múltiplo
  const handleDeleteMultiple = () => {
    setToDeleteIds([...selectedIds])
    deleteModal?.show()
  }

  // confirmação de delete
  const handleConfirmDelete = async () => {
    await Promise.all(toDeleteIds.map(id => deleteItem(id)))
    setSelectedIds(prev => prev.filter(id => !toDeleteIds.includes(id)))
    deleteModal?.hide()
  }

  // duplicar múltiplos
  const handleDuplicateMultiple = async () => {
    await Promise.all(selectedIds.map(id => duplicateItem(id)))
    setSelectedIds([])
  }
  // toggle publish múltiplos
  const handleTogglePublishMultiple = async () => {
    await togglePublishItems(selectedIds)
    setSelectedIds([])
  }

  return (
    <div className="app-container container-xxl">
      <div className="app-page" id="kt_app_page">
        <div className="app-wrapper" id="kt_app_wrapper">
          <AsideDefault />
          <div className="app-main" id="kt_app_main">
            <Content>
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
                    channelName={
                      channels.find(c => c.id === channelId)?.name ?? null
                    }
                    onEditChannel={() =>
                      channelId && console.log('editar canal', channelId)
                    }
                    onCreatePost={() =>
                      channelId && handleCreatePost(channelId)
                    }
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

              {/* Delete Confirmation Modal */}
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
  )
}

export default ContentPage