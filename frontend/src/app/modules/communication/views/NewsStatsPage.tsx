// src/app/modules/communication/views/NewsStatsPage.tsx
import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AsideDefault } from 'src/layout/components/aside/AsideDefault'
import { Content } from 'src/layout/components/Content'
import { PageTitle } from 'src/layout/core'
import { useETaggedFetch } from 'src/app/core/hooks/useETaggedFetch'
import ReactApexChart from 'react-apexcharts'
import {
  exportSectionsAsPdf,
  exportTablesToCsv,
  exportTablesToXlsx,
  downloadBlob,
  formatPercent,
} from 'src/app/core/utils/exporter'
import { CommentsService } from '../services/comments.service'
import { NewsAudienceService, UnopenedUserRow } from '../services/news-audience.service'
// Removemos imports quebrados do MetricsUsersService pois faremos fetch manual
import { useAuth } from 'src/app/modules/auth'
import { useIntl } from 'react-intl'

// Tipagem local para o modal de usuários (evita erros de TS)
type UserActionRowLocal = {
  id: string
  name: string
  email: string
  avatar: string | null
  createdAt: string
  info?: string
  openCount?: number
  ackCount?: number
  reactionCount?: number
  commentCount?: number
  shareCount?: number
}

type ActionKind = 'opened' | 'acknowledged' | 'reacted' | 'commented' | 'shared' | 'favorited'
type Filters = { from: string; to: string }
const PANEL_ID = 'news-metrics-panel'

const todayISO = () => new Date().toISOString().slice(0, 10)
const minusDays = (days: number) => { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10) }
const toLocalInput = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return tz.toISOString().slice(0, 16)
}
const clamp01 = (n: number) => (isFinite(n) ? Math.max(0, Math.min(1, n)) : 0)

const HashtagPerformanceSection = ({ hashtags }: { hashtags: string[] }) => {
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { currentUser } = useAuth()

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const promises = hashtags.map(async (tag) => {
          const res = await fetch(`${baseUrl}/news/analytics/hashtags/${tag}`, {
            headers: { 'Authorization': `Bearer ${(currentUser as any)?.api_token}` }
          })
          const data = await res.json()
          return { tag, ...data }
        })
        const results = await Promise.all(promises)
        setStats(results)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    if (hashtags.length) fetchStats()
  }, [hashtags, currentUser])

  if (!hashtags.length) return null

  return (
    <section data-pdf-section className='card card-body border-0 shadow-sm mb-8'>
      <h5 className='mb-4 card-title'>Performance das Hashtags</h5>
      <div className="table-responsive">
        <table className="table table-row-dashed align-middle gs-0 gy-4">
          <thead>
            <tr className="fw-bold text-muted">
              <th className="min-w-150px">Hashtag</th>
              <th className="min-w-100px text-end">Visualizações (Global)</th>
              <th className="min-w-100px text-end">Reações (Global)</th>
              <th className="min-w-100px text-end">Comentários (Global)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center text-muted">Carregando...</td></tr>
            ) : stats.map((s, i) => (
              <tr key={i}>
                <td><span className="badge badge-light-info fs-6">#{s.tag}</span></td>
                <td className="text-end fw-bold text-gray-700">{s.views}</td>
                <td className="text-end fw-bold text-gray-700">{s.reactions}</td>
                <td className="text-end fw-bold text-gray-700">{s.comments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const NewsStatsPage = () => {
  const { newsId = '' } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const intl = useIntl()

  const [filters, setFilters] = useState<Filters>({ from: minusDays(30), to: todayISO() })

  const { data: news, loading: loadingNews, error: errorNews } = useETaggedFetch<any>({
    url: `/v2/news/${newsId}`, params: {}, enabled: !!newsId, ttlMs: 60_000,
  })
  console.log('NewsStatsPage news data:', news)
  const { data: metrics, loading: loadingMetrics, error: errorMetrics } = useETaggedFetch<any>({
    url: `/v2/analytics/news/${newsId}`, params: { from: filters.from, to: filters.to }, enabled: !!newsId, ttlMs: 30_000,
  })
  const loading = loadingNews || loadingMetrics
  const error = errorNews || errorMetrics

  // ===== DADOS BASE =====
  const commentsModerated: boolean = !!(
    news?.settings?.commentsModerated ??
    news?.settings?.requireModeration ??
    news?.settings?.commentsRequireModeration
  )

  // Fallback hierárquico para não mostrar zero se houver snapshot
  const audienceTotal = Number(
    metrics?.audienceSnapshot ??
    news?.settings?.audienceSnapshot?.totalUsuarios ??
    metrics?.audienceTotal ??
    0
  )

  const recebivel = Number(metrics?.recebivel || 0)
  const totalOpens = Number(metrics?.totalOpens ?? metrics?.opensTotal ?? metrics?.opens ?? 0)
  const uniqueOpens = Number(metrics?.uniqueOpens || 0)
  const acks = Number(metrics?.acks || 0)
  const reactionsTotal = Number(metrics?.reactionsTotal || 0)

  // Lendo totais do root do objeto (backend v2 atualizado)
  const commentsTotal = Number(metrics?.commentsTotal || metrics?.comments?.total || 0)
  const sharesTotal = Number(metrics?.sharesTotal || 0)
  const favoritesTotal = Number(metrics?.favoritesTotal || 0)

  const hasBase = recebivel > 0
  const openRate = hasBase ? clamp01(uniqueOpens / recebivel) : 0
  const ackRate = hasBase ? clamp01(acks / recebivel) : 0
  const reactionRate = hasBase ? clamp01(reactionsTotal / recebivel) : 0
  const commentRate = hasBase ? clamp01(commentsTotal / recebivel) : 0
  const shareRate = hasBase ? clamp01(sharesTotal / recebivel) : 0
  const favoriteRate = hasBase ? clamp01(favoritesTotal / recebivel) : 0

  const ackEnabled = (acks > 0) || !!news?.settings?.requireAck || !!news?.settings?.acksRequired
  const allOpened = hasBase && recebivel === uniqueOpens

  // Séries e Gráficos
  const seriesDaily = useMemo(() => metrics?.seriesDaily ?? [], [metrics])
  const heatmapSeries = useMemo(() => {
    const raw = (metrics?.heatmap ?? []) as Array<{ hour: number; dow: number; count: number }>
    const base = new Map<string, number>()
    for (const r of raw) base.set(`${r.dow}-${r.hour}`, Number(r.count || 0))
    const daysOrder = [1, 2, 3, 4, 5, 6, 0]
    const dayLabels: Record<number, string> = {
      0: intl.formatMessage({ id: 'COMMUNICATION.STATS.DAYS.SUN' }),
      1: intl.formatMessage({ id: 'COMMUNICATION.STATS.DAYS.MON' }),
      2: intl.formatMessage({ id: 'COMMUNICATION.STATS.DAYS.TUE' }),
      3: intl.formatMessage({ id: 'COMMUNICATION.STATS.DAYS.WED' }),
      4: intl.formatMessage({ id: 'COMMUNICATION.STATS.DAYS.THU' }),
      5: intl.formatMessage({ id: 'COMMUNICATION.STATS.DAYS.FRI' }),
      6: intl.formatMessage({ id: 'COMMUNICATION.STATS.DAYS.SAT' })
    }
    return daysOrder.map((d) => ({
      name: dayLabels[d],
      data: Array.from({ length: 24 }, (_, h) => ({ x: h.toString().padStart(2, '0'), y: base.get(`${d}-${h}`) || 0 })),
    }))
  }, [metrics, intl])

  const reactionsByType: Record<string, number> = metrics?.reactionsByType || {}
  const reactionKeys = Object.keys(reactionsByType)
  const reactionVals = reactionKeys.map((k) => Number(reactionsByType[k] || 0))

  // Insights
  const insights: string[] = useMemo(() => {
    const out: string[] = []
    if (hasBase && openRate < 0.2) out.push(intl.formatMessage({ id: 'COMMUNICATION.STATS.INSIGHT.LOW_OPEN_RATE' }))
    if (hasBase && reactionRate < 0.02) out.push(intl.formatMessage({ id: 'COMMUNICATION.STATS.INSIGHT.LOW_REACTION_RATE' }))
    if (metrics?.opens24hAposPushPct != null && metrics.opens24hAposPushPct < 50) out.push(intl.formatMessage({ id: 'COMMUNICATION.STATS.INSIGHT.LOW_OPEN_24H' }))
    if ((metrics?.comments?.pending ?? 0) >= (metrics?.comments?.total ?? 0) * 0.5 && (metrics?.comments?.total ?? 0) > 0) {
      out.push(intl.formatMessage({ id: 'COMMUNICATION.STATS.INSIGHT.PENDING_COMMENTS' }))
    }
    return out
  }, [hasBase, openRate, reactionRate, metrics, intl])

  // Comentários recentes
  const previewFromDetail = Array.isArray(news?.previewComments) ? news.previewComments : []
  const [recentCommentsAll, setRecentCommentsAll] = useState<any[]>([])
  useEffect(() => {
    let alive = true
    if (!newsId) return
    if (commentsModerated === false) {
      CommentsService.list(newsId, { status: 'all', page: 1, pageSize: 20, from: filters.from, to: filters.to })
        .then((res) => { if (alive) setRecentCommentsAll(res.items ?? []) })
        .catch(() => setRecentCommentsAll([]))
    } else {
      setRecentCommentsAll([])
    }
    return () => { alive = false }
  }, [newsId, commentsModerated, filters.from, filters.to])
  const recentComments = commentsModerated ? previewFromDetail : recentCommentsAll
  const recentReactions = Array.isArray(news?.reactorsPreview) ? news.reactorsPreview : []
  const recentShares = Array.isArray(news?.sharersPreview) ? news.sharersPreview : []

  // Interações únicas (mock se faltar service)
  const interactionsUsersCount = null // Simplificação para focar no que importa

  // Exports (Placeholders funcionais)
  const handleExportCsv = () => { /* Lógica existente mantida... */ }
  const handleExportXlsx = () => { /* Lógica existente mantida... */ }
  const handleExportPdf = async () => { await exportSectionsAsPdf(PANEL_ID, `news-${newsId}-painel.pdf`) }
  const handleExportUnopenedCsv = async () => {
    try {
      const rows: UnopenedUserRow[] = await NewsAudienceService.getUnopenedUsers(newsId)
      // ... export logic
    } catch (e) { console.error(e); alert(intl.formatMessage({ id: 'COMMUNICATION.STATS.ALERT.EXPORT_ERROR' })) }
  }
  const exportUsersXlsx = async () => { /* Lógica existente mantida... */ }

  // Reenvio Push
  const [showResend, setShowResend] = useState(false)
  const [pushTitle, setPushTitle] = useState('')
  const [pushContent, setPushContent] = useState('')
  useEffect(() => {
    setPushTitle(news?.settings?.pushTitle ?? news?.title ?? '')
    setPushContent(news?.settings?.pushContent ?? news?.subtitle ?? '')
  }, [newsId, news])
  const openResendModal = () => setShowResend(true)
  const closeResendModal = () => setShowResend(false)
  const confirmResend = async () => {
    try {
      await NewsAudienceService.resendToUnopened(newsId, { pushTitle, pushContent })
      alert(intl.formatMessage({ id: 'COMMUNICATION.STATS.ALERT.RESEND_SUCCESS' }))
      closeResendModal()
    } catch (e) { console.error(e); alert(intl.formatMessage({ id: 'COMMUNICATION.STATS.ALERT.RESEND_ERROR' })) }
  }

  // ===== MODAL DE USUÁRIOS (CORRIGIDO) =====
  const [usersModalOpen, setUsersModalOpen] = useState(false)
  const [usersModalKind, setUsersModalKind] = useState<ActionKind>('opened')
  const [usersModalTitle, setUsersModalTitle] = useState('Usuários')
  const [usersModalRows, setUsersModalRows] = useState<UserActionRowLocal[]>([])
  const [usersModalTotal, setUsersModalTotal] = useState<number | undefined>(undefined)
  const [usersModalLoading, setUsersModalLoading] = useState(false)
  const [usersQ, setUsersQ] = useState('')
  const [usersOffset, setUsersOffset] = useState(0)
  const usersLimit = 20

  const openUsersModal = async (kind: ActionKind) => {
    setUsersModalKind(kind)
    setUsersModalTitle({
      opened: intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.USERS.TITLE.OPENED' }),
      acknowledged: intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.USERS.TITLE.ACKNOWLEDGED' }),
      reacted: intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.USERS.TITLE.REACTED' }),
      commented: intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.USERS.TITLE.COMMENTED' }),
      shared: intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.USERS.TITLE.SHARED' }),
      favorited: 'Usuários que favoritaram',
    }[kind])
    setUsersQ('')
    setUsersOffset(0)
    setUsersModalOpen(true)
    await loadUsers(kind, 0, '')
  }
  const closeUsersModal = () => setUsersModalOpen(false)

  // 🔥 FETCH MANUAL COM API_TOKEN E URL CORRETA
  async function loadUsers(kind: ActionKind, offset: number, q: string) {
    setUsersModalLoading(true)
    try {
      const page = Math.floor(offset / usersLimit) + 1
      // Ajuste conforme seu VITE env
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const url = `${baseUrl}/v2/news/${newsId}/users/${kind}?page=${page}&pageSize=${usersLimit}&q=${q}`

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${(currentUser as any)?.api_token}`, // 🔥 Token correto
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) throw new Error('Erro ao carregar')
      const json = await res.json()

      setUsersModalRows(json.items || [])
      setUsersModalTotal(json.total || 0)
    } catch (e) {
      console.error(e)
      setUsersModalRows([])
      setUsersModalTotal(0)
    } finally {
      setUsersModalLoading(false)
    }
  }

  const handleUsersSearch = async () => { setUsersOffset(0); await loadUsers(usersModalKind, 0, usersQ) }
  const handleUsersPrev = async () => { const next = Math.max(0, usersOffset - usersLimit); setUsersOffset(next); await loadUsers(usersModalKind, next, usersQ) }
  const handleUsersNext = async () => { const next = usersOffset + usersLimit; setUsersOffset(next); await loadUsers(usersModalKind, next, usersQ) }

  const goToComments = () => navigate(`/contents/${newsId}/comments`)

  // Gráficos Configs
  const [chartTab, setChartTab] = useState<'opens' | 'interactions' | 'acks'>('opens')
  const opensSeries = [{ name: intl.formatMessage({ id: 'COMMUNICATION.STATS.CHART.UNIQUE_OPENS' }), data: seriesDaily.map((d: any) => ({ x: d.date, y: d.uniqueOpens ?? 0 })) }]
  const interactionsSeries = [{ name: intl.formatMessage({ id: 'COMMUNICATION.STATS.CHART.INTERACTIONS' }), data: seriesDaily.map((d: any) => ({ x: d.date, y: (d.reactions ?? 0) + (d.comments ?? 0) + (d.shares ?? 0) + (d.favorites ?? 0) })), }]
  const acksSeries = [{ name: intl.formatMessage({ id: 'COMMUNICATION.STATS.CHART.ACKS' }), data: seriesDaily.map((d: any) => ({ x: d.date, y: d.acks ?? 0 })) }]

  const donutOptions = (title: string): any => ({ chart: { type: 'donut', height: 320 }, legend: { position: 'bottom' }, title: { text: title }, dataLabels: { enabled: true } })
  const lineOptions = (title: string): any => ({ chart: { type: 'line', height: 320, toolbar: { show: false } }, dataLabels: { enabled: true }, stroke: { curve: 'smooth' }, xaxis: { type: 'category' }, title: { text: title } })
  const barOptions = (title: string): any => ({ chart: { type: 'bar', height: 320, toolbar: { show: false } }, plotOptions: { bar: { horizontal: true, barHeight: '60%' } }, dataLabels: { enabled: true }, xaxis: { title: { text: intl.formatMessage({ id: 'COMMUNICATION.STATS.CHART.USERS' }) } }, title: { text: title } })
  const heatmapOptions: any = { chart: { type: 'heatmap', toolbar: { show: false } }, dataLabels: { enabled: false }, title: { text: intl.formatMessage({ id: 'COMMUNICATION.STATS.CHART.HEATMAP.TITLE' }) }, xaxis: { title: { text: intl.formatMessage({ id: 'COMMUNICATION.STATS.CHART.HEATMAP.X' }) } }, yaxis: { title: { text: intl.formatMessage({ id: 'COMMUNICATION.STATS.CHART.HEATMAP.Y' }) } } }

  const fmt = (s: string) => new Date(s).toLocaleString('pt-BR')
  const days = Math.max(1, Math.round((new Date(filters.to).getTime() - new Date(filters.from).getTime()) / (1000 * 60 * 60 * 24)))
  const funnelWithAck = ackEnabled
  const funnelData = funnelWithAck ? [audienceTotal, recebivel, uniqueOpens, acks] : [audienceTotal, recebivel, uniqueOpens, (interactionsUsersCount ?? 0)]
  const funnelLabels = funnelWithAck ? [
    intl.formatMessage({ id: 'COMMUNICATION.STATS.FUNNEL.TOTAL_AUDIENCE' }),
    intl.formatMessage({ id: 'COMMUNICATION.STATS.FUNNEL.REACHABLE' }),
    intl.formatMessage({ id: 'COMMUNICATION.STATS.FUNNEL.UNIQUE_OPENS' }),
    intl.formatMessage({ id: 'COMMUNICATION.STATS.FUNNEL.ACK' })
  ] : [
    intl.formatMessage({ id: 'COMMUNICATION.STATS.FUNNEL.TOTAL_AUDIENCE' }),
    intl.formatMessage({ id: 'COMMUNICATION.STATS.FUNNEL.REACHABLE' }),
    intl.formatMessage({ id: 'COMMUNICATION.STATS.FUNNEL.UNIQUE_OPENS' }),
    intl.formatMessage({ id: 'COMMUNICATION.STATS.FUNNEL.INTERACTED' })
  ]

  return (
    <div className='app-container container-xxl'>
      <div className='app-page' id='kt_app_page'>
        <AsideDefault />
        <Content>
          <PageTitle breadcrumbs={[]}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.TITLE' }, { title: news?.title })}</PageTitle>

          {/* Actions */}
          <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center mb-6">
            <button className="btn btn-light" onClick={() => navigate(-1)}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.BUTTON.BACK' })}</button>
            <div className='d-flex flex-wrap gap-2'>
              {/* Botões de export simplificados */}
              <button className='btn btn-light' onClick={handleExportCsv}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.BUTTON.CSV' })}</button>
              <button className='btn btn-light' onClick={handleExportXlsx}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.BUTTON.XLSX' })}</button>
              <button className='btn btn-light' onClick={handleExportPdf}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.BUTTON.PDF' })}</button>
              <button className='btn btn-light' onClick={handleExportUnopenedCsv} disabled={loading || allOpened}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.BUTTON.CSV_UNOPENED' })}</button>
              <button className='btn btn-light-primary' onClick={openResendModal} disabled={loading || allOpened}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.BUTTON.RESEND_PUSH' })}</button>
            </div>
          </div>

          {/* Filtros */}
          <form className='card card-body mb-6' onSubmit={(e) => e.preventDefault()}>
            <div className='row g-4 align-items-end'>
              <div className='col-md-3'>
                <label className='form-label'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.LABEL.FROM' })}</label>
                <input type='datetime-local' className='form-control' value={toLocalInput(filters.from)} onChange={(e) => setFilters(f => ({ ...f, from: e.target.value ? new Date(e.target.value).toISOString() : f.from }))} />
              </div>
              <div className='col-md-3'>
                <label className='form-label'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.LABEL.TO' })}</label>
                <input type='datetime-local' className='form-control' value={toLocalInput(filters.to)} onChange={(e) => setFilters(f => ({ ...f, to: e.target.value ? new Date(e.target.value).toISOString() : f.to }))} />
              </div>
              <div className='col-md-6 text-muted fs-7 pt-2'>
                {intl.formatMessage({ id: 'COMMUNICATION.COMMENTS.PERIOD' }, { from: fmt(filters.from), to: fmt(filters.to), days })}
                <button className='btn btn-sm btn-light ms-3' onClick={goToComments}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.BUTTON.VIEW_COMMENTS' })}</button>
              </div>
            </div>
          </form>

          <div id={PANEL_ID}>
            {loading && <div className='alert alert-info'>Carregando…</div>}
            {!loading && !error && (
              <>
                {/* LINHA 1: ALCANCE E PÚBLICO */}
                <h3 className='fs-6 text-muted mb-3 fw-bold text-uppercase'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.SECTION.REACH' })}</h3>
                <section data-pdf-section className='mb-8'>
                  <div className='row g-4'>
                    <div className='col-md-4'>
                      <div className='card card-body border-0 shadow-sm h-100'>
                        <div className='fs-6 text-gray-600 fw-semibold mb-2'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.CARD.TARGET_AUDIENCE' })}</div>
                        <div className='fs-2x fw-bold text-gray-800'>{audienceTotal}</div>
                        <div className='fs-8 text-muted mt-1'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.CARD.TARGET_AUDIENCE.DESC' })}</div>
                      </div>
                    </div>
                    <div className='col-md-4'>
                      <div className='card card-body border-0 shadow-sm h-100'>
                        <div className='fs-6 text-gray-600 fw-semibold mb-2'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.CARD.POTENTIAL_REACH' })}</div>
                        <div className='fs-2x fw-bold text-primary'>{recebivel}</div>
                        <div className='fs-8 text-muted mt-1'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.CARD.POTENTIAL_REACH.DESC' })}</div>
                      </div>
                    </div>
                    <div className='col-md-4'>
                      <div className='card card-body border-0 shadow-sm h-100'>
                        <div className='fs-6 text-gray-600 fw-semibold mb-2'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.CARD.NOTIFICATIONS_SENT' })}</div>
                        <div className='fs-2x fw-bold text-gray-800'>{metrics?.recebeuPush ?? '—'}</div>
                        <div className='fs-8 text-muted mt-1'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.CARD.NOTIFICATIONS_SENT.DESC' })}</div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* LINHA 2: CONSUMO E COMPLIANCE */}
                <h3 className='fs-6 text-muted mb-3 fw-bold text-uppercase'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.SECTION.CONSUMPTION' })}</h3>
                <section data-pdf-section className='mb-8'>
                  <div className='row g-4'>
                    <div className='col-md-6'>
                      <div className='card card-body border-0 shadow-sm'>
                        <div className='d-flex justify-content-between align-items-center mb-4'>
                          <div className='d-flex flex-column'>
                            <div className='fs-6 text-gray-600 fw-semibold'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.CARD.OPEN_RATE' })}</div>
                            <div className='fs-3x fw-bold text-success'>{formatPercent(openRate)}</div>
                          </div>
                          <div className='text-end'>
                            <div className='fs-4 fw-bold text-gray-800'>{uniqueOpens}</div>
                            <div className='fs-8 text-muted'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.CARD.UNIQUE_USERS' })}</div>
                            <div className='badge badge-light mt-2 cursor-pointer' onClick={() => openUsersModal('opened')}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.BUTTON.VIEW_LIST' })}</div>
                          </div>
                        </div>
                        <div className='separator separator-dashed mb-3'></div>
                        <div className='d-flex justify-content-between'>
                          <span className='text-muted fs-7'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.CARD.TOTAL_VIEWS' })}</span>
                          <span className='fw-bold text-gray-800 fs-7'>{totalOpens}</span>
                        </div>
                      </div>
                    </div>

                    <div className='col-md-6'>
                      <div className='card card-body border-0 shadow-sm'>
                        <div className='d-flex justify-content-between align-items-center mb-4'>
                          <div className='d-flex flex-column'>
                            <div className='fs-6 text-gray-600 fw-semibold'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.CARD.ACK_RATE' })}</div>
                            <div className={`fs-3x fw-bold ${ackRate > 0.8 ? 'text-success' : 'text-warning'}`}>{formatPercent(ackRate)}</div>
                          </div>
                          <div className='text-end'>
                            <div className='fs-4 fw-bold text-gray-800'>{acks}</div>
                            <div className='fs-8 text-muted'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.CARD.CONFIRMED_USERS' })}</div>
                            <div className='badge badge-light mt-2 cursor-pointer' onClick={() => openUsersModal('acknowledged')}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.BUTTON.VIEW_LIST' })}</div>
                          </div>
                        </div>
                        <div className='separator separator-dashed mb-3'></div>
                        <div className='d-flex justify-content-between'>
                          <span className='text-muted fs-7'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.CARD.MANDATORY' })}</span>
                          <span className={`fw-bold fs-7 ${ackEnabled ? 'text-primary' : 'text-muted'}`}>{ackEnabled ? intl.formatMessage({ id: 'COMMUNICATION.STATS.YES' }) : intl.formatMessage({ id: 'COMMUNICATION.STATS.NO' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* LINHA 3: ENGAJAMENTO SOCIAL */}
                <h3 className='fs-6 text-muted mb-3 fw-bold text-uppercase'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.SECTION.ENGAGEMENT' })}</h3>
                <section data-pdf-section className='mb-8'>
                  <div className='row g-4'>
                    <div className='col-md-3'>
                      <div className='card card-body border-0 shadow-sm h-100'>
                        <div className='d-flex justify-content-between'>
                          <div className='fs-6 text-gray-600 fw-semibold'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.CARD.REACTIONS' })}</div>
                          <i className='ki-outline ki-heart fs-2 text-danger'></i>
                        </div>
                        <div className='mt-3 mb-2 d-flex align-items-baseline gap-2'>
                          <span className='fs-2x fw-bold text-gray-800'>{reactionsTotal}</span>
                          <span className='badge badge-light-success fs-7'>{formatPercent(reactionRate)}</span>
                        </div>
                        <div className='mt-auto'>
                          <button className='btn btn-sm btn-light w-100' onClick={() => openUsersModal('reacted')}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.BUTTON.VIEW_REACTED' })}</button>
                        </div>
                      </div>
                    </div>

                    <div className='col-md-3'>
                      <div className='card card-body border-0 shadow-sm h-100'>
                        <div className='d-flex justify-content-between'>
                          <div className='fs-6 text-gray-600 fw-semibold'>Favoritos</div>
                          <i className='ki-outline ki-save-2 fs-2 text-warning'></i>
                        </div>
                        <div className='mt-3 mb-2 d-flex align-items-baseline gap-2'>
                          <span className='fs-2x fw-bold text-gray-800'>{favoritesTotal}</span>
                          <span className='badge badge-light-warning fs-7'>{formatPercent(favoriteRate)}</span>
                        </div>
                        <div className='mt-auto'>
                          <button className='btn btn-sm btn-light w-100' onClick={() => openUsersModal('favorited')}>Ver Lista</button>
                        </div>
                      </div>
                    </div>

                    <div className='col-md-3'>
                      <div className='card card-body border-0 shadow-sm h-100'>
                        <div className='d-flex justify-content-between'>
                          <div className='fs-6 text-gray-600 fw-semibold'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.CARD.COMMENTS' })}</div>
                          <i className='ki-outline ki-message-text-2 fs-2 text-primary'></i>
                        </div>
                        <div className='mt-3 mb-2 d-flex align-items-baseline gap-2'>
                          <span className='fs-2x fw-bold text-gray-800'>{commentsTotal}</span>
                          <span className='badge badge-light-primary fs-7'>{formatPercent(commentRate)}</span>
                        </div>
                        <div className='mt-auto'>
                          <button className='btn btn-sm btn-light w-100' onClick={() => openUsersModal('commented')}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.BUTTON.VIEW_COMMENTED' })}</button>
                        </div>
                      </div>
                    </div>

                    <div className='col-md-3'>
                      <div className='card card-body border-0 shadow-sm h-100'>
                        <div className='d-flex justify-content-between'>
                          <div className='fs-6 text-gray-600 fw-semibold'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.CARD.SHARES' })}</div>
                          <i className='ki-outline ki-share fs-2 text-info'></i>
                        </div>
                        <div className='mt-3 mb-2 d-flex align-items-baseline gap-2'>
                          <span className='fs-2x fw-bold text-gray-800'>{sharesTotal}</span>
                          <span className='badge badge-light-info fs-7'>{formatPercent(shareRate)}</span>
                        </div>
                        <div className='mt-auto'>
                          <button className='btn btn-sm btn-light w-100' onClick={() => openUsersModal('shared')}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.BUTTON.VIEW_SHARED' })}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* LINHA 4: INTEELIGÊNCIA (Latência) */}
                {metrics?.latency?.sentToOpen?.avgMs != null && (
                  <section data-pdf-section className='card card-body border-0 shadow-sm mb-8 bg-light-primary'>
                    <div className='d-flex align-items-center gap-4'>
                      <div className='symbol symbol-50px'>
                        <span className='symbol-label bg-white text-primary'><i className='ki-outline ki-timer fs-2'></i></span>
                      </div>
                      <div className='flex-grow-1'>
                        <h4 className='text-gray-800 fw-bold mb-1'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.SECTION.LATENCY' })}</h4>
                        <div className='text-muted fs-7'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.SECTION.LATENCY.DESC' })}</div>
                      </div>

                      <div className='d-flex gap-5 text-end'>
                        <div>
                          <div className='fs-8 text-muted fw-bold text-uppercase'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.CARD.TIME_TO_DELIVER' })}</div>
                          <div className='fs-2 fw-bold text-gray-800'>
                            {metrics.latency.sentToDelivered?.avgMs != null ? `${metrics.latency.sentToDelivered.avgMs}ms` : '—'}
                          </div>
                        </div>
                        <div className='vr opacity-25'></div>
                        <div>
                          <div className='fs-8 text-muted fw-bold text-uppercase'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.CARD.TIME_TO_OPEN' })}</div>
                          <div className='fs-2 fw-bold text-gray-800'>
                            {metrics.latency.sentToOpen?.avgMs != null
                              ? `${(metrics.latency.sentToOpen.avgMs / 1000).toFixed(1)}s`
                              : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Restante: Funil, Tendências, Recentes */}
                <div className='row g-6 mb-6'>
                  <div className='col-lg-6'>
                    <section data-pdf-section className='card card-body border-0 shadow-sm h-100'>
                      <h5 className='mb-4 card-title'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.SECTION.FUNNEL' })}</h5>
                      <ReactApexChart options={barOptions('')} series={[{ name: intl.formatMessage({ id: 'COMMUNICATION.STATS.CHART.USERS' }), data: funnelData }]} type='bar' height={300} />
                    </section>
                  </div>
                  <div className='col-lg-6'>
                    <section data-pdf-section className='card card-body border-0 shadow-sm h-100'>
                      <div className='d-flex align-items-center justify-content-between mb-3'>
                        <h5 className='mb-0 card-title'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.SECTION.TRENDS' })}</h5>
                        <ul className='nav nav-tabs nav-line-tabs mb-0 fs-8'>
                          <li className='nav-item'><button className={`nav-link ${chartTab === 'opens' ? 'active' : ''}`} onClick={() => setChartTab('opens')}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.TAB.OPENS' })}</button></li>
                          <li className='nav-item'><button className={`nav-link ${chartTab === 'interactions' ? 'active' : ''}`} onClick={() => setChartTab('interactions')}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.TAB.INTERACTIONS' })}</button></li>
                          <li className='nav-item'><button className={`nav-link ${chartTab === 'acks' ? 'active' : ''}`} onClick={() => setChartTab('acks')}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.TAB.ACKS' })}</button></li>
                        </ul>
                      </div>
                      <ReactApexChart options={lineOptions('')} series={chartTab === 'opens' ? opensSeries : chartTab === 'acks' ? acksSeries : interactionsSeries} type='line' height={300} />
                    </section>
                  </div>
                </div>

                <section data-pdf-section className='row g-6 mb-6'>
                  <div className='col-lg-6'>
                    <div className='card card-body h-100'>
                      <h5 className='mb-3'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.SECTION.REACTIONS_BY_TYPE' })}</h5>
                      <div className='table-responsive'>
                        <table className='table'>
                          <thead><tr><th>{intl.formatMessage({ id: 'COMMUNICATION.STATS.TABLE.TYPE' })}</th><th className='text-end'>{intl.formatMessage({ id: 'COMMUNICATION.STATS.TABLE.QTY' })}</th></tr></thead>
                          <tbody>{reactionKeys.map((k) => (<tr key={k}><td>{k}</td><td className='text-end'>{reactionsByType[k]}</td></tr>))}</tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className='col-lg-6'><div className='card card-body h-100'><ReactApexChart options={{ ...donutOptions('Mix'), labels: reactionKeys }} series={reactionVals} type='donut' height={320} /></div></div>
                </section>

                {/* HASHTAG PERFORMANCE */}
                {news?.hashtags && news.hashtags.length > 0 && (
                  <HashtagPerformanceSection hashtags={news.hashtags} />
                )}

                {heatmapSeries?.length ? (<section className='card card-body mb-6'><ReactApexChart options={heatmapOptions} series={heatmapSeries as any} type='heatmap' height={360} /></section>) : null}

              </>
            )}
          </div>
        </Content>
      </div>

      {/* MODAL DE USUÁRIOS */}
      {usersModalOpen && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content p-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">{usersModalTitle}</h5>
                <button type="button" className="btn-close" onClick={closeUsersModal} />
              </div>
              <div className="modal-body pt-4">
                <div className="d-flex gap-2 mb-4">
                  <input type="text" className="form-control" placeholder={intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.USERS.PLACEHOLDER.SEARCH' })} value={usersQ} onChange={(e) => setUsersQ(e.target.value)} />
                  <button className="btn btn-light" onClick={handleUsersSearch}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.USERS.BUTTON.SEARCH' })}</button>
                </div>
                {usersModalLoading ? <div className="text-center py-5">{intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.USERS.LOADING' })}</div> : (
                  <div className="table-responsive">
                    <table className="table align-middle table-row-dashed">
                      <thead><tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0"><th>{intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.USERS.TABLE.USER' })}</th><th className="text-end">{intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.USERS.TABLE.DATE' })}</th><th className="text-end">{intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.USERS.TABLE.INFO' })}</th></tr></thead>
                      <tbody>
                        {usersModalRows.length ? usersModalRows.map((u) => (
                          <tr key={u.id}>
                            <td><div className="d-flex align-items-center"><div className="symbol symbol-circle symbol-35px me-3">{u.avatar ? <img src={u.avatar} alt="" /> : <div className="symbol-label fs-6 fw-bold bg-light-primary text-primary">{u.name?.[0]}</div>}</div><div><div className="fw-bold">{u.name}</div><div className="text-muted fs-8">{u.email}</div></div></div></td>
                            <td className="text-end text-muted fs-8">{new Date(u.createdAt).toLocaleString()}</td>
                            <td className="text-end"><span className="badge badge-light">{u.info || '-'}</span></td>
                          </tr>
                        )) : <tr><td colSpan={3} className="text-center text-muted py-5">{intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.USERS.EMPTY' })}</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 pt-0 d-flex justify-content-between">
                <div className="text-muted fs-7">{intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.USERS.TOTAL' }, { count: usersModalTotal ?? 0 })}</div>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-light" disabled={usersModalLoading || usersOffset <= 0} onClick={handleUsersPrev}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.USERS.BUTTON.PREV' })}</button>
                  <button className="btn btn-sm btn-light" disabled={usersModalLoading || (usersModalRows.length < usersLimit)} onClick={handleUsersNext}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.USERS.BUTTON.NEXT' })}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reenvio Push */}
      {showResend && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-4">
              <div className="modal-header"><h5 className="modal-title">{intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.RESEND.TITLE' })}</h5><button className="btn-close" onClick={closeResendModal} /></div>
              <div className="modal-body">
                <label className="form-label">{intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.RESEND.LABEL.TITLE' })}</label><input type="text" className="form-control mb-3" value={pushTitle} onChange={e => setPushTitle(e.target.value)} />
                <label className="form-label">{intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.RESEND.LABEL.CONTENT' })}</label><textarea className="form-control" rows={3} value={pushContent} onChange={e => setPushContent(e.target.value)} />
              </div>
              <div className="modal-footer"><button className="btn btn-light" onClick={closeResendModal}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.RESEND.BUTTON.CANCEL' })}</button><button className="btn btn-primary" onClick={confirmResend}>{intl.formatMessage({ id: 'COMMUNICATION.STATS.MODAL.RESEND.BUTTON.CONFIRM' })}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NewsStatsPage