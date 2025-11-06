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
import WordCloudCanvas from 'src/app/modules/surveys/components/WordCloudCanvas'
import { CommentsService } from '../services/comments.service'
import { NewsAudienceService, UnopenedUserRow } from '../services/news-audience.service'
import { NewsMetricsUsersService, ActionKind, UserActionRow } from '../services/news-metrics-users.service'

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

const NewsStatsPage = () => {
  const { newsId = '' } = useParams()
  const navigate = useNavigate()

  const [filters, setFilters] = useState<Filters>({ from: minusDays(30), to: todayISO() })

  const { data: news, loading: loadingNews, error: errorNews } = useETaggedFetch<any>({
    url: `/v2/news/${newsId}`, params: {}, enabled: !!newsId, ttlMs: 60_000,
  })
  const { data: metrics, loading: loadingMetrics, error: errorMetrics } = useETaggedFetch<any>({
    url: `/v2/analytics/news/${newsId}`, params: { from: filters.from, to: filters.to }, enabled: !!newsId, ttlMs: 30_000,
  })
  const loading = loadingNews || loadingMetrics
  const error = errorNews || errorMetrics

  // ===== dados base =====
  const commentsModerated: boolean = !!(
    news?.settings?.commentsModerated ??
    news?.settings?.requireModeration ??
    news?.settings?.commentsRequireModeration
  )

  const audienceTotal = Number(
    news?.settings?.audienceSnapshot?.totalUsuarios ??
    metrics?.audienceTotal ??
    metrics?.totalUsuarios ??
    0
  )

  const recebivel = Number(metrics?.recebivel || 0)
  const totalOpens = Number(metrics?.totalOpens ?? metrics?.opensTotal ?? metrics?.opens ?? 0)
  const uniqueOpens = Number(metrics?.uniqueOpens || 0)
  const acks = Number(metrics?.acks || 0)
  const reactionsTotal = Number(metrics?.reactionsTotal || 0)
  const commentsTotal = Number(metrics?.comments?.total || 0)
  const sharesTotal = Number(metrics?.sharesTotal || 0)
  const interactionsEventsTotal = reactionsTotal + commentsTotal + sharesTotal

  const hasBase = recebivel > 0
  const openRate = hasBase ? clamp01(uniqueOpens / recebivel) : 0
  const ackRate = hasBase ? clamp01(acks / recebivel) : 0
  const reactionRate = hasBase ? clamp01(reactionsTotal / recebivel) : 0
  const commentRate = hasBase ? clamp01(commentsTotal / recebivel) : 0
  const shareRate = hasBase ? clamp01(sharesTotal / recebivel) : 0

  const ackEnabled = (acks > 0) || !!news?.settings?.requireAck || !!news?.settings?.acksRequired

  // 🔒 regra do botão: desabilitar se TODOS abriram
  const allOpened = hasBase && recebivel === uniqueOpens

  // séries
  const seriesDaily = useMemo(() => metrics?.seriesDaily ?? [], [metrics])

  // heatmap
  const heatmapSeries = useMemo(() => {
    const raw = (metrics?.heatmap ?? []) as Array<{ hour: number; dow: number; count: number }>
    const base = new Map<string, number>()
    for (const r of raw) base.set(`${r.dow}-${r.hour}`, Number(r.count || 0))
    const daysOrder = [1, 2, 3, 4, 5, 6, 0]
    const dayLabels: Record<number, string> = { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb' }
    return daysOrder.map((d) => ({
      name: dayLabels[d],
      data: Array.from({ length: 24 }, (_, h) => ({ x: h.toString().padStart(2, '0'), y: base.get(`${d}-${h}`) || 0 })),
    }))
  }, [metrics])

  const reactionsByType: Record<string, number> = metrics?.reactionsByType || {}
  const reactionKeys = Object.keys(reactionsByType)
  const reactionVals = reactionKeys.map((k) => Number(reactionsByType[k] || 0))

  // ===== flags corrigidas =====
  const isPublished: boolean = !!(
    (news?.status && String(news.status).toLowerCase() === 'published') ||
    news?.isPublished === true
  )
  const pushSent: boolean = Number(metrics?.recebeuPush || 0) > 0

  // ===== insights =====
  const insights: string[] = useMemo(() => {
    const out: string[] = []
    if (hasBase && openRate < 0.2) out.push('Open rate baixo: considere ajustar título/horário ou reenviar push.')
    if (hasBase && reactionRate < 0.02) out.push('Poucas reações por base: experimente CTAs mais claros.')
    if (metrics?.opens24hAposPushPct != null && metrics.opens24hAposPushPct < 50) out.push('Menos de 50% abriram em 24h após push — tente outros horários.')
    if ((metrics?.comments?.pending ?? 0) >= (metrics?.comments?.total ?? 0) * 0.5 && (metrics?.comments?.total ?? 0) > 0) {
      out.push('Muitos comentários pendentes de moderação.')
    }
    return out
  }, [hasBase, openRate, reactionRate, metrics])

  // ——— Comentários recentes ———
  const previewFromDetail = Array.isArray(news?.previewComments) ? news.previewComments : []
  const [recentCommentsAll, setRecentCommentsAll] = useState<any[]>([])
  useEffect(() => {
    let alive = true
    if (!newsId) return
    if (commentsModerated === false) {
      CommentsService.list(newsId, {
        status: 'all',
        page: 1,
        pageSize: 20,
        from: filters.from,
        to: filters.to,
      })
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

  // ====== Interações únicas (usuários) para o funil ======
  const [interactionsUsersCount, setInteractionsUsersCount] = useState<number | null>(null)
  useEffect(() => {
    let alive = true
    if (!newsId) return
      ; (async () => {
        try {
          const n = await NewsMetricsUsersService.interactionsUniqueCount(newsId, { from: filters.from, to: filters.to })
          if (alive) setInteractionsUsersCount(n)
        } catch {
          if (alive) setInteractionsUsersCount(null)
        }
      })()
    return () => { alive = false }
  }, [newsId, filters.from, filters.to])

  // ===== exports existentes =====
  const handleExportCsv = () => {
    if (!metrics) return
    const resumo = {
      title: 'Resumo', sheetName: 'Resumo',
      columns: [{ key: 'k', label: 'Métrica' }, { key: 'v', label: 'Valor' }],
      rows: [
        { k: 'Público total', v: audienceTotal },
        { k: 'Recebível', v: recebivel },
        { k: 'Aberturas totais', v: totalOpens },
        { k: 'Opens únicos', v: uniqueOpens },
        { k: 'ACKs', v: acks },
        { k: 'Reações', v: reactionsTotal },
        { k: 'Comentários', v: commentsTotal },
        { k: 'Shares', v: sharesTotal },
        { k: 'Open rate', v: formatPercent(openRate) },
        { k: 'Ack rate', v: formatPercent(ackRate) },
        { k: 'Reaction rate', v: formatPercent(reactionRate) },
        { k: 'Comment rate', v: formatPercent(commentRate) },
        { k: 'Share rate', v: formatPercent(shareRate) },
      ],
    } as const
    const reacoes = {
      title: 'Reações por tipo', sheetName: 'Reações',
      columns: [{ key: 'tipo', label: 'Tipo' }, { key: 'count', label: 'Quantidade' }],
      rows: Object.keys(reactionsByType).map((k) => ({ tipo: k, count: reactionsByType[k] || 0 })),
    } as const
    const serie = {
      title: 'Série diária', sheetName: 'Série diária',
      columns: [
        { key: 'date', label: 'Data' },
        { key: 'uniqueOpens', label: 'Unique opens' },
        { key: 'acks', label: 'ACKs' },
        { key: 'reactions', label: 'Reactions' },
        { key: 'comments', label: 'Comments' },
        { key: 'shares', label: 'Shares' },
        { key: 'interactionsEvents', label: 'Interactions (events)' },
      ],
      rows: (seriesDaily || []).map((r: any) => ({
        date: r.date,
        uniqueOpens: r.uniqueOpens ?? 0,
        acks: r.acks ?? 0,
        reactions: r.reactions ?? 0,
        comments: r.comments ?? 0,
        shares: r.shares ?? 0,
        interactionsEvents: (r.reactions ?? 0) + (r.comments ?? 0) + (r.shares ?? 0),
      })),
    } as const
    const blob = exportTablesToCsv([resumo as any, reacoes as any, serie as any], ';')
    downloadBlob(blob, `news-${newsId}-metrics.csv`)
  }

  const handleExportXlsx = () => {
    if (!metrics) return
    const tables: any[] = []
    tables.push({
      title: 'Resumo', sheetName: 'Resumo',
      columns: [{ key: 'k', label: 'Métrica', width: 30 }, { key: 'v', label: 'Valor', width: 20 }],
      rows: [

        { k: 'Público total', v: audienceTotal },
        { k: 'Recebível', v: recebivel },
        { k: 'Aberturas totais', v: totalOpens },
        { k: 'Opens únicos', v: uniqueOpens },
        { k: 'ACKs', v: acks },
        { k: 'Reações', v: reactionsTotal },
        { k: 'Comentários', v: commentsTotal },
        { k: 'Shares', v: sharesTotal },
        { k: 'Open rate', v: formatPercent(openRate) },
        { k: 'Ack rate', v: formatPercent(ackRate) },
        { k: 'Reaction rate', v: formatPercent(reactionRate) },
        { k: 'Comment rate', v: formatPercent(commentRate) },
        { k: 'Share rate', v: formatPercent(shareRate) },
      ],
    })
    tables.push({
      title: 'Reações por tipo', sheetName: 'Reações',
      columns: [{ key: 'tipo', label: 'Tipo', width: 16 }, { key: 'count', label: 'Quantidade', width: 16 }],
      rows: Object.keys(reactionsByType).map((k) => ({ tipo: k, count: reactionsByType[k] || 0 })),
    })
    tables.push({
      title: 'Série diária', sheetName: 'Série diária',
      columns: [
        { key: 'date', label: 'Data', width: 12 }, { key: 'uniqueOpens', label: 'Unique opens', width: 16 },
        { key: 'acks', label: 'ACKs', width: 12 }, { key: 'reactions', label: 'Reactions', width: 12 },
        { key: 'comments', label: 'Comments', width: 12 }, { key: 'shares', label: 'Shares', width: 12 },
        { key: 'interactionsEvents', label: 'Interactions (events)', width: 20 },
      ],
      rows: (seriesDaily || []).map((r: any) => ({
        date: r.date,
        uniqueOpens: r.uniqueOpens ?? 0,
        acks: r.acks ?? 0,
        reactions: r.reactions ?? 0,
        comments: r.comments ?? 0,
        shares: r.shares ?? 0,
        interactionsEvents: (r.reactions ?? 0) + (r.comments ?? 0) + (r.shares ?? 0),
      })),
    })
    exportTablesToXlsx(tables as any, `news-${newsId}-metrics.xlsx`)
  }

  const handleExportPdf = async () => { await exportSectionsAsPdf(PANEL_ID, `news-${newsId}-painel.pdf`) }

  // ===== Reenvio com MODAL =====
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
      alert('Reenvio de push disparado para quem NÃO abriu.')
      closeResendModal()
    } catch (e) {
      console.error(e)
      alert('Falha ao reenviar push.')
    }
  }

  const handleExportUnopenedCsv = async () => {
    try {
      const rows: UnopenedUserRow[] = await NewsAudienceService.getUnopenedUsers(newsId)
      const header = 'Nome,Email'
      const body = rows
        .map((u: UnopenedUserRow) =>
          `${String(u.name || '').replace(/,/g, ' ')},${u.email || ''}`,
        )
        .join('\n')
      const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `news-${newsId}-nao-abriu.csv`; a.click()
    } catch (e) {
      console.error(e)
      alert('Erro ao exportar CSV de não abertos.')
    }
  }

  // ===== MODAL de usuários (opens/acks/reactions/comments/shares) =====
  const [usersModalOpen, setUsersModalOpen] = useState(false)
  const [usersModalKind, setUsersModalKind] = useState<ActionKind>('opened')
  const [usersModalTitle, setUsersModalTitle] = useState('Usuários')
  const [usersModalRows, setUsersModalRows] = useState<UserActionRow[]>([])
  const [usersModalTotal, setUsersModalTotal] = useState<number | undefined>(undefined)
  const [usersModalLoading, setUsersModalLoading] = useState(false)
  const [usersQ, setUsersQ] = useState('')
  const [usersOffset, setUsersOffset] = useState(0)
  const usersLimit = 50

  const openUsersModal = async (kind: ActionKind) => {
    setUsersModalKind(kind)
    setUsersModalTitle({
      opened: 'Usuários que abriram',
      acknowledged: 'Usuários que deram ACK',
      reacted: 'Usuários que reagiram',
      commented: 'Usuários que comentaram',
      shared: 'Usuários que compartilharam',
    }[kind])
    setUsersQ('')
    setUsersOffset(0)
    setUsersModalOpen(true)
    await loadUsers(kind, 0, '')
  }

  const closeUsersModal = () => setUsersModalOpen(false)

  async function loadUsers(kind: ActionKind, offset: number, q: string) {
    setUsersModalLoading(true)
    try {
      const resp = await NewsMetricsUsersService.list(newsId, kind, {
        from: filters.from, to: filters.to, limit: usersLimit, offset, q,
      })
      setUsersModalRows(resp.items)
      setUsersModalTotal(resp.total)
    } catch (e) {
      console.error(e)
      setUsersModalRows([])
      setUsersModalTotal(undefined)
    } finally {
      setUsersModalLoading(false)
    }
  }

  const handleUsersSearch = async () => {
    setUsersOffset(0)
    await loadUsers(usersModalKind, 0, usersQ)
  }

  const handleUsersPrev = async () => {
    const next = Math.max(0, usersOffset - usersLimit)
    setUsersOffset(next)
    await loadUsers(usersModalKind, next, usersQ)
  }

  const handleUsersNext = async () => {
    const next = usersOffset + usersLimit
    setUsersOffset(next)
    await loadUsers(usersModalKind, next, usersQ)
  }

  const exportUsersXlsx = async () => {
    try {
      const [opened, acknowledged, reacted, commented, shared] = await Promise.all([
        NewsMetricsUsersService.listAll(newsId, 'opened', { from: filters.from, to: filters.to }).catch(() => []),
        NewsMetricsUsersService.listAll(newsId, 'acknowledged', { from: filters.from, to: filters.to }).catch(() => []),
        NewsMetricsUsersService.listAll(newsId, 'reacted', { from: filters.from, to: filters.to }).catch(() => []),
        NewsMetricsUsersService.listAll(newsId, 'commented', { from: filters.from, to: filters.to }).catch(() => []),
        NewsMetricsUsersService.listAll(newsId, 'shared', { from: filters.from, to: filters.to }).catch(() => []),
      ])
      const interactions = await NewsMetricsUsersService.listInteractionsAll(newsId, { from: filters.from, to: filters.to }).catch(() => [])

      const asRows = (arr: UserActionRow[]) => arr.map(u => ({
        name: u.name || '',
        email: u.email || '',
        opens: u.openCount ?? '',
        acks: u.ackCount ?? '',
        reactions: u.reactionCount ?? '',
        comments: u.commentCount ?? '',
        shares: u.shareCount ?? '',
      }))

      const tables: any[] = [
        {
          title: 'Aberturas (únicas por usuário)',
          sheetName: 'Aberturas',
          columns: [
            { key: 'name', label: 'Nome', width: 28 },
            { key: 'email', label: 'Email', width: 30 },
            { key: 'opens', label: 'Aberturas', width: 14 },
          ],
          rows: asRows(opened).map(r => ({ name: r.name, email: r.email, opens: r.opens })),
        },
        {
          title: 'ACKs',
          sheetName: 'ACKs',
          columns: [
            { key: 'name', label: 'Nome', width: 28 },
            { key: 'email', label: 'Email', width: 30 },
            { key: 'acks', label: 'ACKs', width: 10 },
          ],
          rows: asRows(acknowledged).map(r => ({ name: r.name, email: r.email, acks: r.acks })),
        },
        {
          title: 'Reações',
          sheetName: 'Reações',
          columns: [
            { key: 'name', label: 'Nome', width: 28 },
            { key: 'email', label: 'Email', width: 30 },
            { key: 'reactions', label: 'Reações', width: 12 },
          ],
          rows: asRows(reacted).map(r => ({ name: r.name, email: r.email, reactions: r.reactions })),
        },
        {
          title: 'Comentários',
          sheetName: 'Comentários',
          columns: [
            { key: 'name', label: 'Nome', width: 28 },
            { key: 'email', label: 'Email', width: 30 },
            { key: 'comments', label: 'Comentários', width: 16 },
          ],
          rows: asRows(commented).map(r => ({ name: r.name, email: r.email, comments: r.comments })),
        },
        {
          title: 'Compartilhamentos',
          sheetName: 'Shares',
          columns: [
            { key: 'name', label: 'Nome', width: 28 },
            { key: 'email', label: 'Email', width: 30 },
            { key: 'shares', label: 'Shares', width: 12 },
          ],
          rows: asRows(shared).map(r => ({ name: r.name, email: r.email, shares: r.shares })),
        },
        {
          title: 'Interações (união)',
          sheetName: 'Interações',
          columns: [
            { key: 'name', label: 'Nome', width: 28 },
            { key: 'email', label: 'Email', width: 30 },
            { key: 'reactions', label: 'Reações', width: 12 },
            { key: 'comments', label: 'Comentários', width: 16 },
            { key: 'shares', label: 'Shares', width: 12 },
          ],
          rows: asRows(interactions).map(r => ({
            name: r.name, email: r.email,
            reactions: r.reactions, comments: r.comments, shares: r.shares,
          })),
        },
      ]

      exportTablesToXlsx(tables as any, `news-${newsId}-usuarios.xlsx`)
    } catch (e) {
      console.error(e)
      alert('Falha ao exportar usuários.')
    }
  }

  const goToComments = () => navigate(`/contents/${newsId}/comments`)

  const donutOptions = (title: string): ApexCharts.ApexOptions => ({
    chart: { type: 'donut', height: 320 }, legend: { position: 'bottom' }, title: { text: title }, dataLabels: { enabled: true },
  })
  const lineOptions = (title: string): ApexCharts.ApexOptions => ({
    chart: { type: 'line', height: 320, toolbar: { show: false } }, dataLabels: { enabled: true }, stroke: { curve: 'smooth' }, xaxis: { type: 'category' }, title: { text: title },
  })
  const barOptions = (title: string): ApexCharts.ApexOptions => ({
    chart: { type: 'bar', height: 320, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, barHeight: '60%' } },
    dataLabels: { enabled: true }, xaxis: { title: { text: 'Usuários' } }, title: { text: title },
  })
  const heatmapOptions: ApexCharts.ApexOptions = {
    chart: { type: 'heatmap', toolbar: { show: false } }, dataLabels: { enabled: false },
    title: { text: 'Aberturas por dia × hora' }, xaxis: { title: { text: 'Hora do dia' } }, yaxis: { title: { text: 'Dia da semana' } },
  }

  // ===== gráfico com abas (estilo staffbase) =====
  const [chartTab, setChartTab] = useState<'opens' | 'interactions' | 'acks'>('opens')
  const opensSeries = [{ name: 'Unique opens', data: seriesDaily.map((d: any) => ({ x: d.date, y: d.uniqueOpens ?? 0 })) }]
  const interactionsSeries = [{
    name: 'Interactions (events)',
    data: seriesDaily.map((d: any) => ({ x: d.date, y: (d.reactions ?? 0) + (d.comments ?? 0) + (d.shares ?? 0) })),
  }]
  const acksSeries = [{ name: 'ACKs', data: seriesDaily.map((d: any) => ({ x: d.date, y: d.acks ?? 0 })) }]

  const fmt = (s: string) => new Date(s).toLocaleString('pt-BR')
  const days = Math.max(1, Math.round((new Date(filters.to).getTime() - new Date(filters.from).getTime()) / (1000 * 60 * 60 * 24)))

  // ===== funil =====
  const funnelWithAck = ackEnabled
  const funnelData = funnelWithAck
    ? [audienceTotal, recebivel, uniqueOpens, acks]
    : [audienceTotal, recebivel, uniqueOpens, (interactionsUsersCount ?? 0)]
  const funnelLabels = funnelWithAck
    ? ['Público total', 'Recebível', 'Aberturas únicas', 'ACK']
    : ['Público total', 'Recebível', 'Aberturas únicas', 'Interagiram (usuários)']

  return (
    <div className='app-container container-xxl'>
      <div className='app-page' id='kt_app_page'>
        <AsideDefault />
        <Content>
          <PageTitle breadcrumbs={[]}>
            Estatísticas da Notícia {news?.title ? `– ${news.title}` : ''}
          </PageTitle>

          {/* Barra de ações */}
          <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center mb-6">
            {/* POP: volta para onde estava */}
            <button className="btn btn-light" onClick={() => navigate(-1)}>← Voltar</button>
            <div className='d-flex flex-wrap gap-2'>
              <button className='btn btn-light' onClick={handleExportCsv} disabled={loading || !!error}>Exportar CSV</button>
              <button className='btn btn-light' onClick={handleExportXlsx} disabled={loading || !!error}>Exportar XLSX</button>
              <button className='btn btn-light' onClick={handleExportPdf} disabled={loading || !!error}>Exportar PDF</button>
              <button className='btn btn-light' onClick={handleExportUnopenedCsv} disabled={loading || !!error || allOpened}>
                Exportar “não abertos” (CSV)
              </button>
              <button className='btn btn-light' onClick={exportUsersXlsx} disabled={loading || !!error}>
                Exportar usuários (XLSX)
              </button>
              <button className='btn btn-light-primary' onClick={openResendModal} disabled={loading || !!error || allOpened}>
                Reenviar push (não abertos)
              </button>
            </div>
          </div>

          {/* Filtros */}
          <form className='card card-body mb-6' onSubmit={(e) => e.preventDefault()}>
            <div className='row g-4 align-items-end'>
              <div className='col-md-3'>
                <label className='form-label'>De</label>
                <input
                  type='datetime-local'
                  className='form-control'
                  value={toLocalInput(filters.from)}
                  onChange={(e) => setFilters(f => ({ ...f, from: e.target.value ? new Date(e.target.value).toISOString() : f.from }))}
                />
              </div>
              <div className='col-md-3'>
                <label className='form-label'>Até</label>
                <input
                  type='datetime-local'
                  className='form-control'
                  value={toLocalInput(filters.to)}
                  onChange={(e) => setFilters(f => ({ ...f, to: e.target.value ? new Date(e.target.value).toISOString() : f.to }))}
                />
              </div>
              <div className='col-md-6 d-flex flex-wrap align-items-center gap-2 text-muted'>
                <span className='badge badge-light fs-8'>Período aplicado: {fmt(filters.from)} — {fmt(filters.to)} ({days} dia{days > 1 ? 's' : ''})</span>
                <span className='ms-2'>Atalhos:</span>
                <button className='btn btn-sm btn-light' onClick={() => setFilters({ from: minusDays(7), to: todayISO() })}>Últimos 7d</button>
                <button className='btn btn-sm btn-light' onClick={() => setFilters({ from: minusDays(30), to: todayISO() })}>Últimos 30d</button>
                <button className='btn btn-sm btn-light' onClick={() => setFilters({ from: minusDays(90), to: todayISO() })}>Últimos 90d</button>
                <button className='btn btn-sm btn-light' onClick={goToComments}>Ver comentários</button>
              </div>
            </div>
          </form>

          {/* Painel */}
          <div id={PANEL_ID}>
            {loading && <div className='alert alert-info'>Carregando…</div>}
            {error && <div className='alert alert-danger'>Erro: {String(error)}</div>}

            {!loading && !error && (
              <>


                {/* TOTAIS com "ver usuários" */}
                <section data-pdf-section className='mb-6'>
                  <div className='row g-6'>
                    <div className='col-md-2'>
                      <div className='card card-body'>
                        <div className='d-flex justify-content-between align-items-center'>
                          <div className='fs-7 text-muted'>Aberturas únicas</div>
                          <button className='badge badge-light text-primary border-0' onClick={() => openUsersModal('opened')}>ver usuários</button>
                        </div>
                        <div className='fs-1 fw-bold'>{uniqueOpens}</div>
                      </div>
                    </div>

                    <div className='col-md-2'>
                      <div className='card card-body'>
                        <div className='fs-7 text-muted'>Aberturas totais</div>
                        <div className='fs-1 fw-bold'>{totalOpens}</div>
                      </div>
                    </div>

                    <div className='col-md-2'>
                      <div className='card card-body'>
                        <div className='d-flex justify-content-between align-items-center'>
                          <div className='fs-7 text-muted'>ACKs</div>
                          <button className='badge badge-light text-primary border-0' onClick={() => openUsersModal('acknowledged')}>ver usuários</button>
                        </div>
                        <div className='fs-1 fw-bold'>{acks}</div>
                      </div>
                    </div>

                    <div className='col-md-2'>
                      <div className='card card-body'>
                        <div className='d-flex justify-content-between align-items-center'>
                          <div className='fs-7 text-muted'>Reações</div>
                          <button className='badge badge-light text-primary border-0' onClick={() => openUsersModal('reacted')}>ver usuários</button>
                        </div>
                        <div className='fs-1 fw-bold'>{reactionsTotal}</div>
                      </div>
                    </div>

                    <div className='col-md-2'>
                      <div className='card card-body'>
                        <div className='d-flex justify-content-between align-items-center'>
                          <div className='fs-7 text-muted'>Comentários</div>
                          <button className='badge badge-light text-primary border-0' onClick={() => openUsersModal('commented')}>ver usuários</button>
                        </div>
                        <div className='fs-1 fw-bold'>{commentsTotal}</div>
                      </div>
                    </div>

                    <div className='col-md-2'>
                      <div className='card card-body'>
                        <div className='d-flex justify-content-between align-items-center'>
                          <div className='fs-7 text-muted'>Shares</div>
                          <button className='badge badge-light text-primary border-0' onClick={() => openUsersModal('shared')}>ver usuários</button>
                        </div>
                        <div className='fs-1 fw-bold'>{sharesTotal}</div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* KPIs % + Reach */}
                <section data-pdf-section className='mb-6'>
                  <div className='row g-6'>
                    <div className='col-md-2'><div className='card card-body'><div className='fs-7 text-muted'>Público total</div><div className='fs-1 fw-bold'>{audienceTotal}</div></div></div>
                    <div className='col-md-2'><div className='card card-body'><div className='fs-7 text-muted'>Reach (recebível)</div><div className='fs-1 fw-bold'>{recebivel}</div></div></div>
                    <div className='col-md-2'><div className='card card-body'><div className='fs-7 text-muted'>Open rate</div><div className='fs-1 fw-bold'>{formatPercent(openRate)}</div></div></div>
                    <div className='col-md-2'><div className='card card-body'><div className='fs-7 text-muted'>Ack rate</div><div className='fs-1 fw-bold'>{formatPercent(ackRate)}</div></div></div>
                    <div className='col-md-2'><div className='card card-body'><div className='fs-7 text-muted'>Reaction rate</div><div className='fs-1 fw-bold'>{formatPercent(reactionRate)}</div></div></div>
                    <div className='col-md-2'><div className='card card-body'><div className='fs-7 text-muted'>Comment/Share rate</div><div className='fs-1 fw-bold'>{formatPercent((commentsTotal + sharesTotal) / Math.max(1, recebivel))}</div></div></div>
                  </div>
                </section>

                {/* Funil */}
                <section data-pdf-section className='card card-body mb-6'>
                  <h5 className='mb-4'>{funnelWithAck ? 'Funil (Público → Recebível → Opens → ACK)' : 'Funil (Público → Recebível → Opens → Interagiram)'}</h5>
                  <ReactApexChart
                    options={barOptions('')}
                    series={[{ name: 'Usuários', data: funnelData }]}
                    type='bar' height={320}
                  />
                  <div className='text-muted mt-2'>
                    {funnelLabels.map((l, i) => (
                      <span key={l} className='me-4'>
                        <span className='badge badge-light me-1'>{i + 1}</span> {l}
                      </span>
                    ))}
                    {!funnelWithAck && interactionsUsersCount === null && (
                      <span className='ms-2 text-warning'>* Interações = eventos (aprox.).</span>
                    )}
                  </div>
                </section>

                {/* Gráfico com abas */}
                <section data-pdf-section className='card card-body mb-6'>
                  <div className='d-flex align-items-center justify-content-between mb-3'>
                    <h5 className='mb-0'>Tendências</h5>
                    <ul className='nav nav-tabs'>
                      <li className='nav-item'><button className={`nav-link ${chartTab === 'opens' ? 'active' : ''}`} onClick={() => setChartTab('opens')}>Aberturas</button></li>
                      <li className='nav-item'><button className={`nav-link ${chartTab === 'interactions' ? 'active' : ''}`} onClick={() => setChartTab('interactions')}>Interações</button></li>
                      <li className='nav-item'><button className={`nav-link ${chartTab === 'acks' ? 'active' : ''}`} onClick={() => setChartTab('acks')}>ACKs</button></li>
                    </ul>
                  </div>
                  {seriesDaily.length ? (
                    <>
                      {chartTab === 'opens' && (
                        <ReactApexChart options={lineOptions('Aberturas únicas por dia')} series={opensSeries} type='line' height={320} />
                      )}
                      {chartTab === 'interactions' && (
                        <ReactApexChart options={lineOptions('Interações (eventos) por dia')} series={interactionsSeries} type='line' height={320} />
                      )}
                      {chartTab === 'acks' && (
                        <ReactApexChart options={lineOptions('ACKs por dia')} series={acksSeries} type='line' height={320} />
                      )}
                    </>
                  ) : <div className='text-center text-muted'>Sem dados no período</div>}
                </section>

                {/* Reações */}
                <section data-pdf-section className='row g-6 mb-6'>
                  <div className='col-lg-6'>
                    <div className='card card-body h-100'>
                      <h5 className='mb-3'>Reações por tipo</h5>
                      <div className='table-responsive'>
                        <table className='table'>
                          <thead><tr><th>Tipo</th><th className='text-end'>Qtde</th></tr></thead>
                          <tbody>
                            {reactionKeys.length ? reactionKeys.map((k) => (
                              <tr key={k}><td>{k}</td><td className='text-end'>{reactionsByType[k] || 0}</td></tr>
                            )) : <tr><td colSpan={2} className='text-muted'>Sem reações no período.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className='col-lg-6'>
                    <div className='card card-body h-100'>
                      <ReactApexChart options={{ ...donutOptions('Reaction mix'), labels: reactionKeys }} series={reactionVals} type='donut' height={320} />
                    </div>
                  </div>
                </section>

                {/* Recentes */}
                <section data-pdf-section className='row g-6 mb-6'>
                  {/* Comentários recentes */}
                  <div className='col-lg-4'>
                    <div className='card card-body h-100'>
                      <h5 className='mb-3'>Últimos comentários</h5>
                      {recentComments.length ? (
                        <ul className='list-unstyled m-0'>
                          {recentComments.slice(0, 8).map((it: any, idx: number) => {
                            const name = it?.name || it?.userName || 'Usuário'
                            const avatar = it?.avatar || it?.avatarUrl || ''
                            const text = it?.text || it?.content || ''
                            const initials = String(name).split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()
                            return (
                              <li className='d-flex align-items-start py-3' key={idx}>
                                <div className='symbol symbol-35px me-3'>
                                  {avatar ? <img src={avatar} alt={name} /> : <div className='symbol-label bg-light text-gray-700 fw-bold'>{initials || 'U'}</div>}
                                </div>
                                <div className='flex-grow-1'>
                                  <div className='fw-semibold'>{name}</div>
                                  <div className='text-muted'>{text}</div>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      ) : <div className='text-muted'>Sem comentários para exibir.</div>}
                    </div>
                  </div>

                  {/* Reações recentes */}
                  <div className='col-lg-4'>
                    <div className='card card-body h-100'>
                      <h5 className='mb-3'>Reações recentes</h5>
                      {Array.isArray(recentReactions) && recentReactions.length ? (
                        <ul className='list-unstyled m-0'>
                          {recentReactions.slice(0, 8).map((it: any, idx: number) => {
                            const name = it?.name || 'Usuário'
                            const avatar = it?.avatar || ''
                            const initials = String(name).split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()
                            return (
                              <li className='d-flex align-items-center py-2' key={idx}>
                                <div className='symbol symbol-35px me-3'>
                                  {avatar ? <img src={avatar} alt={name} /> : <div className='symbol-label bg-light text-gray-700 fw-bold'>{initials || 'U'}</div>}
                                </div>
                                <div className='flex-grow-1'>
                                  <div className='fw-semibold'>{name}</div>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      ) : <div className='text-muted'>Sem reações para exibir.</div>}
                    </div>
                  </div>

                  {/* Shares recentes */}
                  <div className='col-lg-4'>
                    <div className='card card-body h-100'>
                      <h5 className='mb-3'>Shares recentes</h5>
                      {Array.isArray(recentShares) && recentShares.length ? (
                        <ul className='list-unstyled m-0'>
                          {recentShares.slice(0, 8).map((it: any, idx: number) => {
                            const name = it?.name || 'Usuário'
                            const avatar = it?.avatar || ''
                            const initials = String(name).split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()
                            return (
                              <li className='d-flex align-items-center py-2' key={idx}>
                                <div className='symbol symbol-35px me-3'>
                                  {avatar ? <img src={avatar} alt={name} /> : <div className='symbol-label bg-light text-gray-700 fw-bold'>{initials || 'U'}</div>}
                                </div>
                                <div className='flex-grow-1'>
                                  <div className='fw-semibold'>{name}</div>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      ) : <div className='text-muted'>Sem compartilhamentos para exibir.</div>}
                    </div>
                  </div>
                </section>

                {/* Insights */}
                <section data-pdf-section className='card card-body mb-6'>
                  <h5 className='mb-3'>Insights</h5>
                  {insights.length ? <ul className='mb-0'>{insights.map((msg, i) => <li key={i}>{msg}</li>)}</ul> : <div className='text-muted'>Nenhum insight específico para este período.</div>}
                </section>

                {/* Heatmap */}
                {heatmapSeries?.length ? (
                  <section data-pdf-section className='card card-body mb-6'>
                    <ReactApexChart options={heatmapOptions} series={heatmapSeries as any} type='heatmap' height={360} />
                  </section>
                ) : null}
              </>
            )}
          </div>
        </Content>
      </div>

      {/* Modal de Reenvio de Push */}
      {showResend && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-content p-4">
              <div className="modal-header">
                <h5 className="modal-title">Configurar Notificação Push</h5>
                <button type="button" className="btn-close" onClick={closeResendModal} />
              </div>
              <div className="modal-body">
                <div className="mb-10">
                  <label className="form-label">Título do Push</label>
                  <input
                    type="text"
                    className="form-control form-control-solid"
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                  />
                </div>
                <div className="mb-10">
                  <label className="form-label">Conteúdo do Push</label>
                  <textarea
                    className="form-control form-control-solid"
                    rows={3}
                    value={pushContent}
                    onChange={(e) => setPushContent(e.target.value)}
                  />
                </div>
                <small className="text-muted">
                  O app abrirá a notícia pelo deeplink interno.
                </small>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={closeResendModal}>Cancelar</button>
                <button type="button" className="btn btn-primary" onClick={confirmResend}>Reenviar</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Modal de Usuários por Ação */}
      {usersModalOpen && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
          <div className="modal-dialog modal-lg">
            <div className="modal-content p-4">
              <div className="modal-header">
                <h5 className="modal-title">{usersModalTitle}</h5>
                <button type="button" className="btn-close" onClick={closeUsersModal} />
              </div>
              <div className="modal-body">
                <div className="d-flex gap-2 mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por nome ou email…"
                    value={usersQ}
                    onChange={(e) => setUsersQ(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUsersSearch() }}
                  />
                  <button className="btn btn-light" onClick={handleUsersSearch}>Buscar</button>
                </div>

                {usersModalLoading ? (
                  <div className="alert alert-info">Carregando…</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Email</th>
                          {usersModalKind === 'opened' && <th className="text-end">Views</th>}
                          {usersModalKind === 'acknowledged' && <th className="text-end">ACKs</th>}
                          {usersModalKind === 'reacted' && <th className="text-end">Likes</th>}
                          {usersModalKind === 'commented' && <th className="text-end">Comments</th>}
                          {usersModalKind === 'shared' && <th className="text-end">Shares</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {usersModalRows.length ? usersModalRows.map((u) => (
                          <tr key={u.id}>
                            <td>{u.name || '—'}</td>
                            <td>{u.email || '—'}</td>
                            {usersModalKind === 'opened' && <td className="text-end">{u.openCount ?? '—'}</td>}
                            {usersModalKind === 'acknowledged' && <td className="text-end">{u.ackCount ?? '—'}</td>}
                            {usersModalKind === 'reacted' && <td className="text-end">{u.reactionCount ?? '—'}</td>}
                            {usersModalKind === 'commented' && <td className="text-end">{u.commentCount ?? '—'}</td>}
                            {usersModalKind === 'shared' && <td className="text-end">{u.shareCount ?? '—'}</td>}
                          </tr>
                        )) : (
                          <tr><td colSpan={7} className="text-muted">Nada encontrado.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer d-flex justify-content-between">
                <div className="text-muted">
                  {typeof usersModalTotal === 'number' ? `Total: ${usersModalTotal}` : ''}
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-light" disabled={usersModalLoading || usersOffset <= 0} onClick={handleUsersPrev}>← Anterior</button>
                  <button className="btn btn-light" disabled={usersModalLoading || (usersModalRows.length < usersLimit)} onClick={handleUsersNext}>Próxima →</button>
                  <button className="btn btn-primary" onClick={closeUsersModal}>Fechar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default NewsStatsPage