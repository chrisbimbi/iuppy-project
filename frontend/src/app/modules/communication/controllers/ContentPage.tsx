import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AsideDefault } from 'src/layout/components/aside/AsideDefault'
import { Content } from 'src/layout/components/Content'
import { ChannelsList } from 'src/app/modules/channels/components/ChannelsList'
import ChannelModal from 'src/app/modules/channels/components/ChannelModal'
import ContentList from 'src/app/modules/communication/views/ContentList'
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

// ⬇️ capabilities
import { useAccess } from 'src/app/modules/company/providers/AccessProvider'
import { WithCapability } from 'src/app/modules/company/components/WithCapability'

// ⬇️ NEW: overview analytics
import { addDays, formatISO } from 'date-fns'
import { AnalyticsService } from '../../analytics/services/analytics.service'

type SpaceLite = { id: string; name: string }

// helpers simples
const clamp01 = (n: number) => isFinite(n) ? Math.max(0, Math.min(1, n)) : 0
const pct = (n: number) => `${Math.round(clamp01(n) * 100)}%`

// helpers to detect provided fields
const hasProp = (obj: any, key: string) => Object.prototype.hasOwnProperty.call(obj ?? {}, key)

// UI meta about what the backend actually provided
type OverviewMeta = {
  hasTotals: boolean
  baseProvided: boolean
  source?: 'flat-v2' | 'legacy'
}

// defaults to avoid crashes when API omits fields
const EMPTY_TOTALS = {
  recebiveis: 0,
  uniqueOpens: 0,
  acks: 0,
  reactions: 0,
  comments: 0,
  shares: 0,
  publishedCount: 0,
}

const EMPTY_RATES = {
  avgOpenRate: 0,
  avgAckRate: 0,
  avgReactionRate: 0,
  avgCommentRate: 0,
  avgShareRate: 0,
}

// === NORMALIZATION HELPERS (map backend payload -> UI shape) ===
const toNum = (v: any): number => {
  const n = typeof v === 'string' ? parseFloat(v) : v
  return Number.isFinite(n) ? n : 0
}

// Accepts any raw overview payload and normalizes field names / types
const normalizeOverview = (raw: any) => {
  const t = raw?.totals ?? raw ?? {}
  const r = raw?.rates ?? {}

  const totalsObj = raw?.totals ?? {}
  const ratesObj = raw?.rates ?? {}
  const hasTotals = Object.keys(totalsObj).length > 0

  // detect if base/recebiveis was actually provided by the API (even if zero)
  const baseProvided = hasProp(totalsObj, 'recebiveis') || hasProp(totalsObj, 'base') || hasProp(totalsObj, 'totalBase')

  // base mapping (keeps backward compatibility)
  const totals = {
    recebiveis: toNum(t.recebiveis ?? t.base ?? t.totalBase),
    uniqueOpens: toNum(t.uniqueOpens ?? t.unique_opens ?? t.opensUnique),
    acks: toNum(t.acks ?? t.acknowledgements ?? t.ack_count),
    reactions: toNum(t.reactions ?? t.reacts ?? t.reactions_count),
    comments: toNum(t.comments ?? t.comment_count),
    shares: toNum(t.shares ?? t.share_count),
    publishedCount: toNum(t.publishedCount ?? t.published_count ?? t.posts ?? raw?.publishedCount),
  }

  const rates = {
    avgOpenRate: toNum(r.avgOpenRate ?? r.openRate ?? r.open_rate),
    avgAckRate: toNum(r.avgAckRate ?? r.ackRate ?? r.ack_rate),
    avgReactionRate: toNum(r.avgReactionRate ?? r.reactionRate ?? r.reaction_rate),
    avgCommentRate: toNum(r.avgCommentRate ?? r.commentRate ?? r.comment_rate),
    avgShareRate: toNum(r.avgShareRate ?? r.shareRate ?? r.share_rate),
  }

  // NEW: support for flat v2 overview shape
  // e.g. { openRate30d, ackRate30d, reactionsPerBase, totalInteractions, items: [...] }
  if (typeof raw?.openRate30d !== 'undefined') {
    rates.avgOpenRate = toNum(raw.openRate30d)
  }
  if (typeof raw?.ackRate30d !== 'undefined') {
    rates.avgAckRate = toNum(raw.ackRate30d)
  }
  if (typeof raw?.reactionsPerBase !== 'undefined') {
    rates.avgReactionRate = toNum(raw.reactionsPerBase)
  }
  if (typeof raw?.totalInteractions !== 'undefined') {
    const ti = toNum(raw.totalInteractions)
    // Se não vierem parciais (reactions/comments/shares), alocamos tudo em reactions
    if (toNum(totals.reactions) === 0 && toNum(totals.comments) === 0 && toNum(totals.shares) === 0) {
      totals.reactions = ti
    }
  }
  if (Array.isArray(raw?.items)) {
    totals.publishedCount = raw.items.length
  }

  // clamp rates para [0,1]
  rates.avgOpenRate = clamp01(toNum(rates.avgOpenRate))
  rates.avgAckRate = clamp01(toNum(rates.avgAckRate))
  rates.avgReactionRate = clamp01(toNum(rates.avgReactionRate))
  rates.avgCommentRate = clamp01(toNum(rates.avgCommentRate))
  rates.avgShareRate = clamp01(toNum(rates.avgShareRate))

  // identify source flavor
  const source: OverviewMeta['source'] = typeof raw?.openRate30d !== 'undefined' ? 'flat-v2' : 'legacy'

  return {
    totals: { ...EMPTY_TOTALS, ...totals },
    rates: { ...EMPTY_RATES, ...rates },
    meta: { hasTotals, baseProvided, source },
  }
}

// === DEBUG LOGGERS ===
const debugOverview = (
  raw: any,
  normalized: any,
  ctx: { spaceId: string | null; channelId: string | null; fromISO: string; toISO: string }
) => {
  try {
    console.groupCollapsed('%c[ContentPage][OVERVIEW] payload', 'color:#0ea5e9;font-weight:bold')
    console.log('context', ctx)
    console.log('raw', raw)
    console.log('raw keys', Object.keys(raw ?? {}))
    console.log('raw.totals keys', Object.keys(raw?.totals ?? {}))
    console.log('raw.rates keys', Object.keys(raw?.rates ?? {}))
    console.log('normalized', normalized)
    console.log('normalized.totals', normalized?.totals)
    console.log('normalized.rates', normalized?.rates)
    console.log('normalized.meta', normalized?.meta)
    console.groupEnd()
  } catch (err) {
    console.warn('[ContentPage][OVERVIEW] could not log', err)
  }
}

const ContentPage: React.FC = () => {
  const { currentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const { can, loading: aclLoading } = useAccess()

  const [spaces, setSpaces] = useState<SpaceLite[]>([])
  const [spaceId, setSpaceId] = useState<string | null>(null)
  const [channels, setChannels] = useState<any[]>([])
  const [channelId, setChannelId] = useState<string | null>(null)

  // canal-modal
  const [showChannelModal, setShowChannelModal] = useState(false)
  const [editingChannelId, setEditingChannelId] = useState<string | undefined>()

  // conteúdo
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  const deleteRef = useRef<HTMLDivElement>(null)
  const [formModal, setFormModal] = useState<Modal | null>(null)
  const [deleteModal, setDeleteModal] = useState<Modal | null>(null)

  const [editingId, setEditingId] = useState<string>()
  const [wizardInitialValues, setWizardInitialValues] =
    useState<CreateContentDto>({ ...initialNewValues, channelId: '' })
  const [toDeleteIds, setToDeleteIds] = useState<string[]>([])
  const noop = () => { }
  const noopAsync = async () => { }

  // hook de dados (conteúdos)
  const { items, loading, error, refetch } = useContent({ channelId })
  const {
    createItem,
    editItem,
    duplicateItem,
    deleteItem,
    togglePublishItems,
  } = useContentActions(refetch)

  // inicializações bootstrap/layout
  useEffect(() => {
    if (formRef.current) setFormModal(new Modal(formRef.current))
    if (deleteRef.current) setDeleteModal(new Modal(deleteRef.current))
    MenuComponent.reinitialization()
    DrawerComponent.bootstrap()
    setTimeout(() => DrawerComponent.createInstances('#kt_stats_drawer'), 50)
  }, [])

  // query params → estado
  useEffect(() => {
    const p = new URLSearchParams(location.search)
    const sp = p.get('spaceId')
    const ch = p.get('channelId')
    if (sp && sp !== spaceId) setSpaceId(sp)
    if (ch && ch !== channelId) setChannelId(ch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  // carregar espaços
  useEffect(() => {
    if (!currentUser) return
    spacesService.list(currentUser.companyId).then((data: SpaceLite[]) => {
      setSpaces(data)
    })
  }, [currentUser])

  // lista de espaços que o usuário pode VER 'news'
  const visibleSpaces = useMemo(
    () => spaces.filter((s) => can('view', 'news', s.id)),
    [spaces, can]
  )

  // selecionar o primeiro espaço permitido (se ainda não houver um selecionado ou o atual não for permitido)
  useEffect(() => {
    if (aclLoading) return
    if (!visibleSpaces.length) {
      setSpaceId(null)
      return
    }
    if (!spaceId || !visibleSpaces.some((s) => s.id === spaceId)) {
      setSpaceId(visibleSpaces[0].id)
    }
  }, [visibleSpaces, spaceId, aclLoading])

  // ao trocar de espaço, resetar canal e buscar canais
  useEffect(() => {
    if (!spaceId || !currentUser) {
      setChannels([])
      setChannelId(null)
      return
    }
    ChannelsService.list(currentUser.companyId, spaceId).then((data) => {
      setChannels(data)
      if (!channelId && data.length) setChannelId(data[0].id)
      if (channelId && !data.some((c) => c.id === channelId)) {
        setChannelId(data.length ? data[0].id : null)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId, currentUser])

  // manter URL em sincronia
  useEffect(() => {
    const qs = new URLSearchParams()
    if (spaceId) qs.set('spaceId', spaceId)
    if (channelId) qs.set('channelId', channelId)
    navigate({ pathname: '/contents', search: qs.toString() }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId, channelId])

  // conteúdo: sucesso
  const handleSaved = () => {
    formModal?.hide()
    refetch()
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  // criar post
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

  // editar conteúdo
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
        .filter((u) => u)
        .map((u) => ({ url: u, name: u.split('/').pop()! })),
      highlightImages: (original.highlightImages ?? [])
        .filter((u) => u)
        .map((u) => ({ url: u, name: u.split('/').pop()! })),
      settings: { ...original.settings },
    })
    formModal?.show()
  }

  // seleção
  const handleSelect = (id: string, checked: boolean) =>
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))

  // exclusão
  const handleDeleteContent = (id: string) => {
    setToDeleteIds([id])
    deleteModal?.show()
  }
  const handleDeleteMultiple = () => {
    setToDeleteIds([...selectedIds])
    deleteModal?.show()
  }
  const handleConfirmDelete = async () => {
    await Promise.all(toDeleteIds.map((id) => deleteItem(id)))
    setSelectedIds((prev) => prev.filter((id) => !toDeleteIds.includes(id)))
    deleteModal?.hide()
  }

  // duplicar / publicar múltiplos
  const handleDuplicateMultiple = async () => {
    await Promise.all(selectedIds.map((id) => duplicateItem(id)))
    setSelectedIds([])
  }
  const handleTogglePublishMultiple = async () => {
    await togglePublishItems(selectedIds)
    setSelectedIds([])
  }

  // 🔐 gates no espaço atual para o módulo **news** (conteúdos)
  const canViewNewsHere = useMemo(
    () => (spaceId ? can('view', 'news', spaceId) : can('view', 'news')),
    [can, spaceId]
  )
  const canEditNewsHere = useMemo(
    () => (spaceId ? can('edit', 'news', spaceId) : can('edit', 'news')),
    [can, spaceId]
  )
  const canManageNewsHere = useMemo(
    () => (spaceId ? can('manage', 'news', spaceId) : can('manage', 'news')),
    [can, spaceId]
  )

  // modal de canal — atrelar a "gerenciar conteúdos"
  const openChannelModal = (id?: string) => {
    if (!canManageNewsHere) {
      alert('Você não tem permissão para criar/editar canais neste espaço.')
      return
    }
    setEditingChannelId(id)
    setShowChannelModal(true)
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

  const currentSpaceName =
    spaces.find((s) => s.id === spaceId)?.name ?? (visibleSpaces[0]?.name ?? 'Conteúdos')

  // ===== NEW: Overview (cards no topo) =====
  const [fromISO, toISO] = useMemo(() => {
    const to = new Date()
    const from = addDays(to, -30)
    return [formatISO(from, { representation: 'date' }), formatISO(to, { representation: 'date' })]
  }, [])
  const [ovLoading, setOvLoading] = useState(false)
  const [ovError, setOvError] = useState<string | null>(null)
  const [overview, setOverview] = useState<null | {
    totals: { recebiveis: number; uniqueOpens: number; acks: number; reactions: number; comments: number; shares: number; publishedCount: number }
    rates: { avgOpenRate: number; avgAckRate: number; avgReactionRate: number; avgCommentRate: number; avgShareRate: number }
    meta: OverviewMeta
  }>(null)

  useEffect(() => {
    {
      let alive = true
      if (!spaceId) { setOverview(null); return }
      setOvLoading(true); setOvError(null)

      // DEBUG: request params
      console.debug('[ContentPage][OVERVIEW] request', { from: fromISO, to: toISO, spaceId, channelId })

      AnalyticsService.newsOverview({ from: fromISO, to: toISO, spaceId: spaceId || undefined, channelId: channelId || undefined })
        .then((data) => {
          if (!alive) return
          const safe = normalizeOverview(data)
          debugOverview(data, safe, { spaceId, channelId, fromISO, toISO })
          setOverview(safe as any)
        })
        .catch((e) => {
          if (!alive) return
          console.error('[ContentPage][OVERVIEW] error', e, { spaceId, channelId, fromISO, toISO })
          setOvError(e?.message ?? 'Erro ao carregar overview')
        })
        .finally(() => { if (alive) setOvLoading(false) })
      return () => { alive = false }
    }
  }, [spaceId, channelId, fromISO, toISO])

  useEffect(() => {
    if (!overview) return
    console.groupCollapsed('%c[ContentPage][OVERVIEW] using in UI', 'color:#a78bfa;font-weight:bold')
    console.log('totals', overview.totals)
    console.log('rates', overview.rates)
    console.log('meta', overview.meta)
    console.groupEnd()
  }, [overview])

  // 🚧 sem acesso a nenhum espaço de conteúdos
  if (!aclLoading && visibleSpaces.length === 0) {
    return (
      <div className="app-container container-xxl">
        <div className="app-page" id="kt_app_page">
          <AsideDefault />
          <Content>
            <div className="alert alert-warning">
              Você não tem permissão para visualizar Conteúdos em nenhum espaço.
            </div>
          </Content>
        </div>
      </div>
    )
  }

  // 🚧 bloqueio de visualização do espaço atual
  if (!aclLoading && spaceId && !canViewNewsHere) {
    return (
      <div className="app-container container-xxl">
        <div className="app-page" id="kt_app_page">
          <AsideDefault />
          <Content>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <select
                className="form-select w-auto"
                value={spaceId ?? ''}
                onChange={(e) => {
                  const next = e.target.value || null
                  setSpaceId(next)
                  setChannelId(null) // previne “canal órfão” ao mudar de espaço
                  setSelectedIds([])
                }}
              >
                {visibleSpaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="alert alert-warning">
              Você não tem permissão para visualizar Conteúdos neste espaço.
            </div>
          </Content>
        </div>
      </div>
    )
  }

  // derived safe overview fields for JSX
  const totals = overview?.totals ?? EMPTY_TOTALS
  const rates = overview?.rates ?? EMPTY_RATES

  // --- display rates and meta logic ---
  const baseProvided = overview?.meta?.baseProvided ?? false
  const hasTotals = overview?.meta?.hasTotals ?? false
  const base = totals.recebiveis
  const safeRate = (num: number, den: number) => (den > 0 ? clamp01(num / den) : 0)

  const displayRates = {
    open: baseProvided ? safeRate(totals.uniqueOpens, base) : rates.avgOpenRate,
    ack: baseProvided ? safeRate(totals.acks, base) : rates.avgAckRate,
    reaction: baseProvided ? safeRate(totals.reactions, base) : rates.avgReactionRate,
    comment: baseProvided ? safeRate(totals.comments, base) : rates.avgCommentRate,
    share: baseProvided ? safeRate(totals.shares, base) : rates.avgShareRate,
  }

  // DEBUG which values will be shown to the user
  try {
    console.groupCollapsed('%c[ContentPage][OVERVIEW] display values', 'color:#22c55e;font-weight:bold')
    console.log('baseProvided', baseProvided, 'base', base)
    console.log('hasTotals', hasTotals)
    console.log('displayRates', displayRates)
    console.groupEnd()
  } catch { }

  return (
    <div className="app-container container-xxl">
      <div className="app-page" id="kt_app_page">
        <div className="app-wrapper" id="kt_app_wrapper">
          <AsideDefault />
          <div className="app-main" id="kt_app_main">
            <Content>
              {/* Filtro por espaço (como Surveys) */}
              <div className="d-flex justify-content-between align-items-center mb-6">
                <div className="d-flex align-items-center gap-3">
                  <h2 className="fw-bold text-dark m-0">
                    Espaço:{' '}
                    <span className="text-primary">{currentSpaceName}</span>
                  </h2>
                  <select
                    className="form-select w-auto"
                    value={spaceId ?? ''}
                    onChange={(e) => {
                      const next = e.target.value || null
                      setSpaceId(next)
                      setChannelId(null) // ao trocar de espaço, zera o canal para recarregar a lista
                      setSelectedIds([])
                    }}
                  >
                    {visibleSpaces.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botão extra de criação de canal (opcional) */}
                <WithCapability action="manage" moduleKey="news" spaceId={spaceId ?? undefined}>
                  {(enabled) => (
                    <button
                      className="btn btn-light-primary"
                      disabled={!enabled}
                      onClick={() => openChannelModal()}
                    >
                      + Canal
                    </button>
                  )}
                </WithCapability>
              </div>

              {success && <div className="alert alert-success">Ação realizada com sucesso!</div>}

              {/* ===== NEW: CARDS DE OVERVIEW (ESPAÇO/CANAL) ===== */}
              <div className="row g-5 mb-6">
                <div className="col-md-3">
                  <div className="card">
                    <div className="card-body">
                      <div className="text-muted fs-7">Open rate (30 dias)</div>
                      {ovLoading ? <div className="fw-bold fs-2">...</div> :
                        ovError ? <div className="text-danger">{ovError}</div> :
                          <div className="fw-bold fs-2">{pct(displayRates.open)}</div>}
                      <div className="text-muted fs-8">Recebíveis: {overview?.meta?.baseProvided ? totals.recebiveis : '—'}</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card">
                    <div className="card-body">
                      <div className="text-muted fs-7">Ack rate</div>
                      {ovLoading ? <div className="fw-bold fs-2">...</div> :
                        ovError ? <div className="text-danger">{ovError}</div> :
                          <div className="fw-bold fs-2">{pct(displayRates.ack)}</div>}
                      <div className="text-muted fs-8">Acks: {hasTotals ? totals.acks : '—'}</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card">
                    <div className="card-body">
                      <div className="text-muted fs-7">Reações / base</div>
                      {ovLoading ? <div className="fw-bold fs-2">...</div> :
                        ovError ? <div className="text-danger">{ovError}</div> :
                          <div className="fw-bold fs-2">{pct(displayRates.reaction)}</div>}
                      <div className="text-muted fs-8">Reações: {hasTotals ? totals.reactions : '—'}</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card">
                    <div className="card-body">
                      <div className="text-muted fs-7">Interações totais</div>
                      {ovLoading ? <div className="fw-bold fs-2">...</div> :
                        ovError ? <div className="text-danger">{ovError}</div> :
                          <div className="fw-bold fs-2">
                            {totals.reactions + totals.comments + totals.shares}
                          </div>}
                      <div className="text-muted fs-8">Publicações: {totals.publishedCount}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-5">
                {/* coluna canais */}
                <div className="col-12 col-lg-4 col-xl-3">
                  <ChannelsList
                    channels={channels}
                    selectedChannelId={channelId}
                    onChannelSelect={(id) => {
                      setChannelId(id)
                      setSelectedIds([])
                    }}
                    // só exibe o botão de criar se pudermos gerenciar Conteúdos aqui
                    onCreateChannel={canManageNewsHere ? () => openChannelModal() : () => { }}
                  />
                </div>

                {/* coluna conteúdos */}
                <div className="col-12 col-lg-8 col-xl-9">
                  <ContentList
                    channelName={channels.find((c) => c.id === channelId)?.name ?? null}
                    items={items}
                    loading={loading}
                    error={error}
                    selectedIds={selectedIds}
                    onSelect={handleSelect}
                    // Handlers SEMPRE definidos:
                    onEditChannel={canManageNewsHere ? () => openChannelModal(channelId ?? undefined) : noop}
                    onCreatePost={canEditNewsHere && channelId ? () => handleCreatePost(channelId) : noop}
                    onEdit={canEditNewsHere ? handleEditContent : noop}
                    onDuplicate={canEditNewsHere ? duplicateItem : noopAsync}
                    onDelete={canEditNewsHere ? handleDeleteContent : noop}
                    onDeleteMultiple={canEditNewsHere ? handleDeleteMultiple : noop}
                    onDuplicateMultiple={canEditNewsHere ? handleDuplicateMultiple : noopAsync}
                    onTogglePublishMultiple={canEditNewsHere ? handleTogglePublishMultiple : noopAsync}
                  />
                </div>
              </div>

              {/* modal de criação/edição de conteúdo */}
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

              {/* modal de excluir conteúdo */}
              <div className="modal fade" tabIndex={-1} ref={deleteRef} id="kt_modal_delete">
                <div className="modal-dialog">
                  <div className="modal-content p-4">
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
                      <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                        Cancelar
                      </button>
                      <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
                        Confirmar exclusão
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* modal de criar/editar canal */}
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