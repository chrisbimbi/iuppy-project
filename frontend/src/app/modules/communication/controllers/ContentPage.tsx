import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AsideDefault } from 'src/layout/components/aside/AsideDefault'
import { Content } from 'src/layout/components/Content'
import { ChannelsList } from 'src/app/modules/channels/components/ChannelsList'
import ChannelModal from 'src/app/modules/channels/components/ChannelModal'
import { useAuth } from 'src/app/modules/auth'

import { useContent } from '../providers/useContent'
import { useContentActions } from '../providers/useContentActions'
import { spacesService } from 'src/app/modules/spaces/services/spaces.service'
import { ChannelsService } from '../../channels/services/channels.service'
import { ContentService } from '../services/content.service'
import { CreateNewsDto as CreateContentDto } from '@shared/types'
import { Modal } from 'bootstrap'
import { DrawerComponent, MenuComponent } from 'src/assets/ts/components'
import { initialNewValues } from '../views/ContentForm/helpers/initialValues'
import ContentForm from '../views/ContentForm/views/ContentForm'
import { useAccess } from 'src/app/modules/company/providers/AccessProvider'
import { addDays, formatISO } from 'date-fns'
import { AnalyticsService } from '../../analytics/services/analytics.service'

import ContentList from '../views/ContentList'
import { useIntl } from 'react-intl'

type SpaceLite = { id: string; name: string }

const clamp01 = (n: number) => (isFinite(n) ? Math.max(0, Math.min(1, n)) : 0)
const pct = (n: number) => `${Math.round(clamp01(n) * 100)}%`
const fmtInt = (n: number) => n.toLocaleString('pt-BR')

// Valores padrão zerados
const EMPTY_STATS = {
  recebiveis: 0,
  uniqueOpens: 0,
  acks: 0,
  reactions: 0,
  comments: 0,
  shares: 0,
  publishedCount: 0,
  avgOpenRate: 0,
  avgAckRate: 0,
  avgReactionRate: 0,
  avgInteractionRate: 0
}

const ContentPage: React.FC = () => {
  const intl = useIntl()
  const { currentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { can, loading: aclLoading } = useAccess()

  const [spaces, setSpaces] = useState<SpaceLite[]>([])
  const [spaceId, setSpaceId] = useState<string | null>(null)
  const [channels, setChannels] = useState<any[]>([])
  const [channelId, setChannelId] = useState<string | null>(null)

  const [showChannelModal, setShowChannelModal] = useState(false)
  const [editingChannelId, setEditingChannelId] = useState<string | undefined>()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  const deleteRef = useRef<HTMLDivElement>(null)
  const [formModal, setFormModal] = useState<Modal | null>(null)
  const [deleteModal, setDeleteModal] = useState<Modal | null>(null)

  const [editingId, setEditingId] = useState<string>()
  const [wizardInitialValues, setWizardInitialValues] = useState<CreateContentDto>({ ...initialNewValues, channelId: '' })
  const [toDeleteIds, setToDeleteIds] = useState<string[]>([])

  const noop = () => { }
  const noopAsync = async () => { }

  // Hook original que busca a lista "crua"
  const { items: rawItems, loading: listLoading, error: listError, refetch } = useContent({ channelId })
  const { createItem, editItem, duplicateItem, deleteItem, togglePublishItems } = useContentActions(refetch)

  // Estado local para itens enriquecidos com métricas
  const [enrichedItems, setEnrichedItems] = useState<any[]>([])
  const [metricsLoading, setMetricsLoading] = useState(false)



  // Sync URL Params
  useEffect(() => {
    const p = new URLSearchParams(location.search)
    const sp = p.get('spaceId')
    const ch = p.get('channelId')
    if (sp && sp !== spaceId) setSpaceId(sp)
    if (ch && ch !== channelId) setChannelId(ch)
  }, [location.search])

  // Load Spaces
  useEffect(() => {
    if (!currentUser) return
    spacesService.list(currentUser.companyId).then((data: SpaceLite[]) => setSpaces(data))
  }, [currentUser])

  const visibleSpaces = useMemo(() => spaces.filter((s) => can('view', 'news', s.id)), [spaces, can])

  useEffect(() => {
    if (aclLoading) return
    if (!visibleSpaces.length) { setSpaceId(null); return }
    if (!spaceId || !visibleSpaces.some((s) => s.id === spaceId)) setSpaceId(visibleSpaces[0].id)
  }, [visibleSpaces, spaceId, aclLoading])

  // Efeitos de inicialização (Movido para após visibleSpaces ser declarado)
  useEffect(() => {
    if (formRef.current) setFormModal(new Modal(formRef.current))
    if (deleteRef.current) setDeleteModal(new Modal(deleteRef.current))
    MenuComponent.reinitialization()
    DrawerComponent.bootstrap()
  }, [aclLoading, visibleSpaces])

  // Load Channels
  useEffect(() => {
    if (!spaceId || !currentUser) {
      setChannels([]); setChannelId(null); return
    }
    ChannelsService.list(currentUser.companyId, spaceId).then((data) => {
      setChannels(data)
      if (!channelId && data.length) setChannelId(data[0].id)
      if (channelId && !data.some((c) => c.id === channelId)) setChannelId(data.length ? data[0].id : null)
    })
  }, [spaceId, currentUser])

  useEffect(() => {
    const qs = new URLSearchParams()
    if (spaceId) qs.set('spaceId', spaceId)
    if (channelId) qs.set('channelId', channelId)
    navigate({ pathname: '/contents', search: qs.toString() }, { replace: true })
  }, [spaceId, channelId])

  // 🔥 LÓGICA DE ENRIQUECIMENTO DE MÉTRICAS (BATCH) 🔥
  // Quando rawItems muda (carregados pelo hook useContent), buscamos as métricas deles
  useEffect(() => {
    if (!rawItems.length) {
      setEnrichedItems([])
      return
    }
    let alive = true
    setMetricsLoading(true)

    const ids = rawItems.map(i => i.id)

    ContentService.batchMetrics(ids)
      .then(metricsMap => {
        if (!alive) return
        const enriched = rawItems.map(item => {
          const m = metricsMap[item.id] || {}

          // Normalização robusta
          const finalMetrics = {
            recebivel: Number(m.recebivel || m.base || 0),
            open: Number(m.totalOpens || m.open || 0),
            unique: Number(m.uniqueOpens || m.unique || 0),
            ack: Number(m.acks || m.ack || 0),
            reactions: Number(m.reactionsTotal || m.reactions || 0),
            comments: Number(m.commentsTotal || m.comments || 0),
            shares: Number(m.sharesTotal || m.shares || 0),
          }

          // Detecção correta de Push Sent (Vindo do batchMetrics ou settings)
          const pushSent = (m.recebeuPush > 0) || (item.settings as any)?.pushNotification === true

          return {
            ...item,
            metrics: finalMetrics,
            pushSent
          }
        })
        setEnrichedItems(enriched)
      })
      .catch(err => {
        console.error("Erro ao carregar métricas em lote", err)
        // Fallback: mostra sem métricas
        setEnrichedItems(rawItems)
      })
      .finally(() => { if (alive) setMetricsLoading(false) })

    return () => { alive = false }
  }, [rawItems])

  const handleSaved = () => {
    formModal?.hide()
    refetch()
    bumpOverview()
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleCreatePost = (chId: string) => {
    setEditingId(undefined)
    setWizardInitialValues({ ...initialNewValues, channelId: chId, authorId: String(currentUser!.id), companyId: currentUser!.companyId })
    formModal?.show()
  }

  const handleEditContent = async (id: string) => {
    const original = await ContentService.get(id)
    setEditingId(id)
    setWizardInitialValues({
      title: original.title,
      subtitle: original.subtitle,
      content: original.content,
      hashtags: original.hashtags || [],
      channelId: original.channelId,
      authorId: original.authorId,
      companyId: original.companyId!,
      isPublished: original.isPublished,
      attachments: (original.attachments ?? []).filter((u) => u).map((u) => ({ url: u, name: u.split('/').pop()! })),
      highlightImages: (original.highlightImages ?? []).filter((u) => u).map((u) => ({ url: u, name: u.split('/').pop()! })),
      settings: { ...original.settings },
    })
    formModal?.show()
  }

  const handleSelect = (id: string, checked: boolean) => setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))
  const handleDeleteContent = (id: string) => { setToDeleteIds([id]); deleteModal?.show() }
  const handleDeleteMultiple = () => { setToDeleteIds([...selectedIds]); deleteModal?.show() }
  const handleConfirmDelete = async () => {
    await Promise.all(toDeleteIds.map((id) => deleteItem(id)))
    setSelectedIds((prev) => prev.filter((id) => !toDeleteIds.includes(id)))
    deleteModal?.hide()
    bumpOverview()
  }
  const handleDuplicateMultiple = async () => { await Promise.all(selectedIds.map((id) => duplicateItem(id))); setSelectedIds([]); bumpOverview() }
  const handleTogglePublishMultiple = async () => { await togglePublishItems(selectedIds); setSelectedIds([]); bumpOverview() }

  const canViewNewsHere = useMemo(() => (spaceId ? can('view', 'news', spaceId) : can('view', 'news')), [can, spaceId])
  const canEditNewsHere = useMemo(() => (spaceId ? can('edit', 'news', spaceId) : can('edit', 'news')), [can, spaceId])
  const canManageNewsHere = useMemo(() => (spaceId ? can('manage', 'news', spaceId) : can('manage', 'news')), [can, spaceId])

  const openChannelModal = (id?: string) => {
    if (!canManageNewsHere) { alert(intl.formatMessage({ id: 'COMMUNICATION.PAGE.ALERT.NO_PERMISSION_MANAGE' })); return }
    setEditingChannelId(id); setShowChannelModal(true)
  }
  const closeChannelModal = () => setShowChannelModal(false)
  const handleChannelSaved = async () => {
    if (currentUser && spaceId) {
      const data = await ChannelsService.list(currentUser.companyId, spaceId)
      setChannels(data)
      if (!channelId && data.length) setChannelId(data[0].id)
    }
    closeChannelModal()
  }

  const currentSpaceName = spaces.find((s) => s.id === spaceId)?.name ?? (visibleSpaces[0]?.name ?? 'Conteúdos')

  // ===== OVERVIEW (STATS) =====
  const [fromISO, toISO] = useMemo(() => {
    const to = new Date()
    const from = addDays(to, -30)
    return [formatISO(from, { representation: 'date' }), formatISO(to, { representation: 'date' })]
  }, [])
  const [ovLoading, setOvLoading] = useState(false)
  const [stats, setStats] = useState(EMPTY_STATS)
  const [ovNonce, setOvNonce] = useState(0)
  const bumpOverview = () => setOvNonce(n => n + 1)

  useEffect(() => {
    let alive = true
    if (!spaceId) return
    setOvLoading(true)

    AnalyticsService.newsOverview({
      from: fromISO, to: toISO, spaceId: spaceId, channelId: channelId || undefined, excludeDeleted: true,
    }).then((data: any) => {
      if (!alive) return

      // Cálculo local de taxas agregado dos itens retornados (mais confiável somar itens)
      const t = data.items ? data.items.reduce((acc: any, item: any) => {
        const m = item.metrics || {}
        acc.recebiveis += (m.recebivel || m.base || 0)
        acc.uniqueOpens += (m.unique || m.uniqueOpens || 0)
        acc.acks += (m.ack || m.acks || 0)
        acc.reactions += (m.reactions || m.reactionsTotal || 0)
        acc.comments += (m.comments || m.commentsTotal || 0)
        acc.shares += (m.shares || m.sharesTotal || 0)
        return acc
      }, { ...EMPTY_STATS }) : EMPTY_STATS

      // 🔥 CORREÇÃO 1: Garante que a base para porcentagem seja >= views (para corrigir 100% de 0)
      const baseReal = Math.max(t.recebiveis, t.uniqueOpens);
      const base = baseReal || 1; // Não dividir por zero

      const publishedCount = data.total || data.items?.length || 0; // Total publicado no período

      setStats({
        ...t,
        publishedCount,
        avgOpenRate: t.uniqueOpens / base,
        avgAckRate: t.acks / base,
        avgReactionRate: t.reactions / base,
        avgInteractionRate: (t.reactions + t.comments + t.shares) / base,
        // Adicionando a base real calculada para o card
        recebiveis: baseReal,
      })
    }).catch(console.error).finally(() => { if (alive) setOvLoading(false) })
    return () => { alive = false }
  }, [spaceId, channelId, ovNonce])

  if (!aclLoading && visibleSpaces.length === 0) {
    return <div className="p-5 alert alert-warning">{intl.formatMessage({ id: 'COMMUNICATION.PAGE.ALERT.NO_PERMISSION' })}</div>
  }

  // Usar o número de itens da lista crua para o card "Publicações"
  const totalItemsInList = rawItems.length;
  const baseForRates = stats.recebiveis || 1;

  return (
    <div className="app-container container-xxl">
      <div className="app-page" id="kt_app_page">
        <div className="app-wrapper" id="kt_app_wrapper">
          <AsideDefault />
          <div className="app-main" id="kt_app_main">
            <Content>
              <div className="d-flex justify-content-between align-items-center mb-8">
                <div className="d-flex align-items-center gap-3">
                  <h2 className="fw-bold text-dark m-0 fs-2">
                    {intl.formatMessage({ id: 'COMMUNICATION.PAGE.TITLE' }, { spaceName: <span className="text-primary">{currentSpaceName}</span> })}
                  </h2>
                  <select
                    className="form-select form-select-sm w-auto fw-bold"
                    value={spaceId ?? ''}
                    onChange={(e) => { setSpaceId(e.target.value || null); setChannelId(null); setSelectedIds([]) }}
                  >
                    {visibleSpaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <button className="btn btn-sm btn-light-primary fw-bold" onClick={() => navigate(`/analytics/contents?spaceId=${spaceId}`)}>
                  <i className="ki-outline ki-chart-line fs-4 me-1"></i> {intl.formatMessage({ id: 'COMMUNICATION.PAGE.BUTTON.DASHBOARD' })}
                </button>
              </div>

              {success && <div className="alert alert-success mb-5">{intl.formatMessage({ id: 'COMMUNICATION.PAGE.SUCCESS' })}</div>}

              {/* Cards de Resumo (REORGANIZADOS E LIMPOS) */}
              <div className="row g-5 mb-8">
                {/* Card 1: Publicações */}
                <div className="col-md-3">
                  <div className="card border-0 shadow-sm h-100 bg-primary bg-opacity-10">
                    <div className="card-body d-flex flex-column justify-content-center text-center">
                      {/* 🔥 CORREÇÃO 2: Usa o tamanho da lista (visual) */}
                      <div className="fs-3x fw-bold text-primary lh-1 mb-2">{totalItemsInList}</div>
                      <div className="text-gray-800 fw-semibold fs-7 text-uppercase">{intl.formatMessage({ id: 'COMMUNICATION.PAGE.CARD.PUBLICATIONS' })}</div>
                      <div className="text-muted fs-9">{intl.formatMessage({ id: 'COMMUNICATION.PAGE.CARD.PUBLICATIONS.SUB' })}</div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Alcance e Abertura */}
                <div className="col-md-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <span className="text-gray-600 fw-semibold fs-7">{intl.formatMessage({ id: 'COMMUNICATION.PAGE.CARD.OPEN_RATE' })}</span>
                        <i className="ki-outline ki-eye fs-3 text-success"></i>
                      </div>
                      <div className="fs-2x fw-bold text-gray-800 lh-1 mb-1">{pct(stats.avgOpenRate)}</div>
                      {/* 🔥 CORREÇÃO 1: Usa o Base Real Consistente */}
                      <div className="text-muted fs-8">{intl.formatMessage({ id: 'COMMUNICATION.PAGE.CARD.OPEN_RATE.SUB' }, { count: fmtInt(stats.recebiveis) })}</div>
                    </div>
                  </div>
                </div>

                {/* Card 3: Engajamento (Likes/Comments) */}
                <div className="col-md-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <span className="text-gray-600 fw-semibold fs-7">{intl.formatMessage({ id: 'COMMUNICATION.PAGE.CARD.ENGAGEMENT' })}</span>
                        <i className="ki-outline ki-heart fs-3 text-danger"></i>
                      </div>
                      <div className="fs-2x fw-bold text-gray-800 lh-1 mb-1">{fmtInt(stats.reactions + stats.comments)}</div>
                      <div className="text-muted fs-8">{intl.formatMessage({ id: 'COMMUNICATION.PAGE.CARD.ENGAGEMENT.SUB' })}</div>
                    </div>
                  </div>
                </div>

                {/* Card 4: Compliance (Acks) */}
                <div className="col-md-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <span className="text-gray-600 fw-semibold fs-7">{intl.formatMessage({ id: 'COMMUNICATION.PAGE.CARD.ACK_RATE' })}</span>
                        <i className="ki-outline ki-check-circle fs-3 text-info"></i>
                      </div>
                      <div className="fs-2x fw-bold text-gray-800 lh-1 mb-1">{pct(stats.avgAckRate)}</div>
                      <div className="text-muted fs-8">{intl.formatMessage({ id: 'COMMUNICATION.PAGE.CARD.ACK_RATE.SUB' }, { count: fmtInt(stats.acks) })}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-5">
                <div className="col-12 col-lg-3">
                  <div className="card border-0 shadow-sm h-100">
                    <ChannelsList
                      channels={channels}
                      selectedChannelId={channelId}
                      onChannelSelect={(id) => { setChannelId(id); setSelectedIds([]) }}
                      onCreateChannel={() => openChannelModal()}
                      canManage={canManageNewsHere}
                    />
                  </div>
                </div>

                <div className="col-12 col-lg-9">
                  {/* Passamos enrichedItems que contém as métricas reais */}
                  <ContentList
                    channelName={channels.find((c) => c.id === channelId)?.name ?? intl.formatMessage({ id: 'COMMUNICATION.PAGE.CHANNEL.ALL' })}
                    items={enrichedItems}
                    loading={listLoading || metricsLoading}
                    error={listError}
                    selectedIds={selectedIds}
                    onSelect={handleSelect}
                    onEditChannel={canManageNewsHere && channelId ? () => openChannelModal(channelId) : undefined}
                    onCreatePost={canEditNewsHere && channelId ? () => handleCreatePost(channelId) : undefined}
                    onEdit={canEditNewsHere ? handleEditContent : undefined}
                    onDuplicate={canEditNewsHere ? duplicateItem : undefined}
                    onDelete={canEditNewsHere ? handleDeleteContent : undefined}
                    onDeleteMultiple={canEditNewsHere ? handleDeleteMultiple : undefined}
                    onDuplicateMultiple={canEditNewsHere ? handleDuplicateMultiple : undefined}
                    onTogglePublishMultiple={canEditNewsHere ? handleTogglePublishMultiple : undefined}
                  />
                </div>
              </div>

              {/* Modais */}
              <div className="modal fade modal-xl" tabIndex={-1} ref={formRef}>
                <div className="modal-dialog modal-fullscreen-lg-down">
                  <div className="modal-content p-4">
                    <ContentForm
                      initialValues={wizardInitialValues}
                      editingId={editingId}
                      onSaved={handleSaved}
                      contextSpaceId={spaceId}
                      contextChannelId={channelId}
                    />
                  </div>
                </div>
              </div>

              <div className="modal fade" tabIndex={-1} ref={deleteRef} id="kt_modal_delete">
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header border-0">
                      <h3 className="modal-title fw-bold">{intl.formatMessage({ id: 'COMMUNICATION.PAGE.MODAL.DELETE.TITLE' })}</h3>
                      <div className="btn btn-icon btn-sm btn-active-light-primary ms-2" data-bs-dismiss="modal">
                        <i className="ki-outline ki-cross fs-1"></i>
                      </div>
                    </div>
                    <div className="modal-body py-0">
                      <p className="text-gray-600 fs-6">
                        {intl.formatMessage({ id: 'COMMUNICATION.PAGE.MODAL.DELETE.MESSAGE' }, { count: <strong>{toDeleteIds.length}</strong> })}
                      </p>
                    </div>
                    <div className="modal-footer border-0">
                      <button type="button" className="btn btn-light" data-bs-dismiss="modal">{intl.formatMessage({ id: 'COMMUNICATION.PAGE.MODAL.DELETE.BUTTON.CANCEL' })}</button>
                      <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>{intl.formatMessage({ id: 'COMMUNICATION.PAGE.MODAL.DELETE.BUTTON.CONFIRM' })}</button>
                    </div>
                  </div>
                </div>
              </div>

              {showChannelModal && (
                <ChannelModal
                  show={showChannelModal}
                  onHide={closeChannelModal}
                  channelId={editingChannelId}
                  companyId={currentUser!.companyId}
                  onSave={handleChannelSaved}
                />
              )}
            </Content>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContentPage