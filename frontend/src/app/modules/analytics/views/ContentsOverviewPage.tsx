import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AsideDefault } from 'src/layout/components/aside/AsideDefault'
import { Content } from 'src/layout/components/Content'
import { useAuth } from 'src/app/modules/auth'
import { useAccess } from 'src/app/modules/company/providers/AccessProvider'
import { spacesService } from 'src/app/modules/spaces/services/spaces.service'
import { ChannelsService } from 'src/app/modules/channels/services/channels.service'
import {
  AnalyticsService,
  NewsOverviewItem,
  NewsOverviewSeriesPoint,
  OverviewSortBy,
  OverviewSortDir,
} from 'src/app/modules/analytics/services/analytics.service'
import { addDays, formatISO } from 'date-fns'
import ReactApexChart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import LatencyCdfChart from '../components/LatencyCdfChart'
import LatencyHistogram from '../components/LatencyHistogram'
import { exportTablesToCsv, downloadBlob } from 'src/app/core/utils/exporter'
import { ContentService } from 'src/app/modules/communication/services/content.service'

type SpaceLite = { id: string; name: string }
type ChannelLite = { id: string; name: string }

type CDFPoint = { x: number; y: number }
type LatencyHistogramBin = { label: string; count: number }
type LatencySummary = { p50: number | null; p90: number | null; avg?: number | null }

const isoDate = (d: Date | string) => {
  const x = typeof d === 'string' ? new Date(d) : d
  return new Date(x.getFullYear(), x.getMonth(), x.getDate()).toISOString().slice(0, 10)
}

/**
 * Constrói a SÉRIE DIÁRIA a partir das linhas (posts) do período,
 * somando as métricas de cada post pelo seu dia de criação.
 */
const buildSeriesFromRows = (
  rows: NewsOverviewItem[],
  fromISO: string,
  toISO: string,
): NewsOverviewSeriesPoint[] => {
  const from = new Date(fromISO)
  const to = new Date(toISO) // [from, to) exclusivo

  type Agg = { posts: number; opens: number; uniqueOpens?: number; reactions: number; comments: number; shares: number; acks?: number }
  const map = new Map<string, Agg>()

  for (const r of rows) {
    const k = isoDate(r.createdAt)
    const cur: Agg = map.get(k) || { posts: 0, opens: 0, uniqueOpens: undefined, reactions: 0, comments: 0, shares: 0, acks: 0 }
    cur.posts += 1
    cur.opens += Number(r.metrics.open ?? 0)
    if (typeof r.metrics.unique === 'number') cur.uniqueOpens = (cur.uniqueOpens ?? 0) + r.metrics.unique
    cur.reactions += Number(r.metrics.reactions ?? 0)
    cur.comments += Number(r.metrics.comments ?? 0)
    cur.shares += Number(r.metrics.shares ?? 0)
    cur.acks = (cur.acks ?? 0) + Number((r.metrics as any).ack ?? 0)
    map.set(k, cur)
  }

  const out: NewsOverviewSeriesPoint[] = []
  for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
    const k = isoDate(d)
    const v = map.get(k)
    out.push({
      date: k,
      posts: v?.posts ?? 0,
      opens: v?.opens ?? 0,
      uniqueOpens: v?.uniqueOpens ?? 0,
      reactions: v?.reactions ?? 0,
      comments: v?.comments ?? 0,
      shares: v?.shares ?? 0,
      ...(v?.acks != null ? { acks: v.acks } : {}),
    } as any)
  }
  return out
}

const hasAnyMetricInSeries = (series: NewsOverviewSeriesPoint[]) =>
  !!series?.length &&
  series.some(
    (s) =>
      (s.opens ?? 0) > 0 ||
      (s.uniqueOpens ?? 0) > 0 ||
      (s.reactions ?? 0) > 0 ||
      (s.comments ?? 0) > 0 ||
      (s.shares ?? 0) > 0 ||
      (s.posts ?? 0) > 0,
  )

const COLOR_BY_KEY: Record<'posts' | 'open' | 'unique' | 'reactions' | 'comments' | 'shares' | 'ack', string> = {
  posts: '#50CD89',
  open: '#3E97FF',
  unique: '#7239EA',
  reactions: '#F1416C',
  comments: '#181C32',
  shares: '#FFC700',
  ack: '#0095E8',
}

const ContentsOverviewPage: React.FC = () => {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { can } = useAccess()

  const [spaces, setSpaces] = useState<SpaceLite[]>([])
  const [spaceId, setSpaceId] = useState<string | null>(null)
  const [channels, setChannels] = useState<ChannelLite[]>([])
  const [channelId, setChannelId] = useState<string | null>(null)

  // ===== Filtro de período (afeta tudo) =====
  type DatePreset = '7d' | '14d' | '30d' | '60d' | '90d' | 'custom'
  const [datePreset, setDatePreset] = useState<DatePreset>('7d')
  // usamos "to" = amanhã (exclusivo) para incluir hoje
  const [fromISO, setFromISO] = useState(() => {
    const end = addDays(new Date(), 1)
    return formatISO(addDays(end, -7), { representation: 'date' })
  })
  const [toISO, setToISO] = useState(() => formatISO(addDays(new Date(), 1), { representation: 'date' }))
  const [customFrom, setCustomFrom] = useState<string>('')
  const [customTo, setCustomTo] = useState<string>('')

  const applyPreset = (preset: DatePreset) => {
    const end = addDays(new Date(), 1) // amanhã (exclusivo)
    let start = end
    switch (preset) {
      case '7d':
        start = addDays(end, -7)
        break
      case '14d':
        start = addDays(end, -14)
        break
      case '30d':
        start = addDays(end, -30)
        break
      case '60d':
        start = addDays(end, -60)
        break
      case '90d':
        start = addDays(end, -90)
        break
      case 'custom':
        return
    }
    setDatePreset(preset)
    setFromISO(formatISO(start, { representation: 'date' }))
    setToISO(formatISO(end, { representation: 'date' }))
    setPage(1)
  }

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return
    const endExclusive = addDays(new Date(customTo), 1)
    setDatePreset('custom')
    setFromISO(customFrom)
    setToISO(formatISO(endExclusive, { representation: 'date' }))
    setPage(1)
  }

  const [sortBy, setSortBy] = useState<OverviewSortBy>('open')
  const [sortDir, setSortDir] = useState<OverviewSortDir>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<NewsOverviewItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const [seriesDaily, setSeriesDaily] = useState<NewsOverviewSeriesPoint[]>([])
  const [allRows, setAllRows] = useState<NewsOverviewItem[]>([])

  const [pushLatency, setPushLatency] = useState<{ cdf: CDFPoint[]; histogram: LatencyHistogramBin[]; summary: LatencySummary }>({
    cdf: [],
    histogram: [],
    summary: { p50: null, p90: null, avg: null },
  })

  const [hoveredMetric, setHoveredMetric] =
    useState<null | 'posts' | 'open' | 'unique' | 'reactions' | 'comments' | 'shares' | 'ack'>(null)
  const [channelMetric, setChannelMetric] =
    useState<'open' | 'unique' | 'reactions' | 'comments' | 'shares'>('open')

  // Carregar espaços com permissão
  useEffect(() => {
    if (!currentUser) return
    spacesService.list(currentUser.companyId).then((data: SpaceLite[]) => {
      const allowed = data.filter((s) => can('view', 'news', s.id))
      setSpaces(allowed)
      // Se houver 1 único espaço, pode pré-selecionar (opcional). Não marcar por padrão para permitir "todos".
      // if (allowed.length === 1 && !spaceId) setSpaceId(allowed[0].id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

  // Carregar canais do espaço (só depois que tiver spaceId)
  useEffect(() => {
    if (!currentUser) {
      setChannels([])
      if (channelId) setChannelId(null)
      return
    }

    const load = async () => {
      // Se tem espaço selecionado, carrega só os canais dele
      if (spaceId) {
        const list = await ChannelsService.list(currentUser.companyId, spaceId)
        setChannels(list || [])
        setChannelId(null)
        return
      }

      // Sem espaço selecionado: carrega canais de TODOS os espaços permitidos
      const allSpaces = await spacesService.list(currentUser.companyId)
      const allowed = allSpaces.filter((s: any) => can('view', 'news', s.id))
      const lists = await Promise.all(
        allowed.map((s: any) => ChannelsService.list(currentUser.companyId, s.id))
      )
      const flat = lists.flat() || []
      // garante shape {id, name}
      setChannels(flat.map((c: any) => ({ id: c.id, name: c.name })))
      setChannelId(null)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId, currentUser, spaces])

  const chName = (id: string) => channels.find((c) => c.id === id)?.name ?? id
  const spName = (id: string) => spaces.find((s) => s.id === id)?.name ?? id

  // Utilitário de normalização do item vindo do backend
  const normalizeItem = (it: any): NewsOverviewItem => {
    const published = Boolean(it.isPublished == true)
    const pushSent: boolean | undefined =
      typeof it.pushSent === 'boolean'
        ? it.pushSent
        : typeof it?.settings?.pushNotification !== 'undefined'
          ? Boolean(it.settings.pushNotification)
          : undefined

    return {
      ...it,
      published,
      pushSent,
      metrics: {
        open: it.metrics?.open ?? it.metrics?.opens ?? 0,
        unique: (it.metrics as any)?.unique ?? (it.metrics as any)?.uniqueOpens ?? undefined,
        ack: it.metrics?.ack ?? it.metrics?.acks ?? 0,
        reactions: it.metrics?.reactions ?? 0,
        comments: it.metrics?.comments ?? 0,
        shares: it.metrics?.shares ?? 0,
        base: it.metrics?.base,
      },
    } as NewsOverviewItem
  }

  // Ordenação client-side (para o caso de "todos os espaços")
  const compareRows = (a: NewsOverviewItem, b: NewsOverviewItem) => {
    const dir = (sortDir ?? 'desc') === 'asc' ? 1 : -1
    const pick = (x: NewsOverviewItem) => {
      switch (sortBy) {
        case 'open': return x.metrics.open ?? 0
        case 'unique': return x.metrics.unique ?? 0
        case 'ack': return (x.metrics as any).ack ?? 0
        case 'reactions': return x.metrics.reactions ?? 0
        case 'comments': return x.metrics.comments ?? 0
        case 'shares': return x.metrics.shares ?? 0
        case 'title': return (x.title ?? '').toLowerCase()
        case 'createdAt':
        default: return x.createdAt ?? ''
      }
    }
    const va = pick(a), vb = pick(b)
    if (typeof va === 'string' && typeof vb === 'string') {
      return va.localeCompare(vb) * dir
    }
    return (va === vb ? 0 : (va > vb ? 1 : -1)) * dir
  }

  async function fetchOverview() {
    if (!currentUser) {
      setRows([])
      setAllRows([])
      setTotal(0)
      setSeriesDaily([])
      setPushLatency({ cdf: [], histogram: [], summary: { p50: null, p90: null, avg: null } })
      return
    }

    setLoading(true)
    setError(null)

    try {
      // CASO 1: espaço selecionado -> usa paginação do backend como antes
      if (spaceId) {
        const resp = await AnalyticsService.newsOverview({
          from: fromISO,
          to: toISO,
          spaceId: spaceId,
          channelId: channelId || undefined,
          excludeDeleted: true,
          sortBy,
          sortDir,
          page,
          pageSize,
        })

        let baseRows: NewsOverviewItem[] = (resp.items || []).map(normalizeItem)

        // Bulk (página atual)
        const pageIds = baseRows.map((r) => r.id)
        if (pageIds.length) {
          try {
            const bulk = await AnalyticsService.getNewsMetrics(pageIds, { from: fromISO, to: toISO })
            const num = (v: any) => {
              const n = Number(v)
              return Number.isFinite(n) ? n : undefined
            }
            baseRows = baseRows.map((r) => {
              const b = (bulk as any)?.[r.id] || {}
              const open = num(b.totalOpens) ?? r.metrics.open ?? 0
              const unique = num(b.uniqueOpens) ?? r.metrics.unique
              const ack = num(b.acks) ?? r.metrics.ack ?? 0
              const reacts = num(b.reactionsTotal) ?? r.metrics.reactions ?? 0
              const comms = num(b.commentsTotal) ?? r.metrics.comments ?? 0
              const shares = num(b.sharesTotal) ?? r.metrics.shares ?? 0
              const base = num(b.recebivel) ?? r.metrics.base

              const recebeu = num((b as any).recebeuPush)
              const pushSent =
                recebeu != null
                  ? recebeu > 0
                  : (typeof (b as any).recebeuPush === 'boolean'
                    ? (b as any).recebeuPush
                    : r.pushSent)

              return { ...r, pushSent, metrics: { ...r.metrics, open, unique, ack, reactions: reacts, comments: comms, shares, base } }
            })
          } catch (e) {
            console.warn('[overview] bulk metrics (page) falhou', e)
          }
        }

        // Hidratar PUSH via /news — só quando há canal (não vazar outros espaços)
        if (channelId) {
          try {
            const newsList = await ContentService.list(channelId)
            const pushMap = new Map<string, boolean>()
            for (const n of newsList) pushMap.set(n.id, !!(n as any)?.settings?.pushNotification)
            baseRows = baseRows.map((r) => (pushMap.has(r.id) ? { ...r, pushSent: pushMap.get(r.id)! } : r))
          } catch (e) {
            console.warn('[overview] hidratação push via /news (page) falhou', e)
          }
        }

        // ALL ROWS (sem paginação) para cards/gráfico
        let allRowsLocal: NewsOverviewItem[] = []
        try {
          const respAll = await AnalyticsService.newsOverview({
            from: fromISO,
            to: toISO,
            spaceId: spaceId,
            channelId: channelId || undefined,
            excludeDeleted: true,
            page: 1,
            pageSize: 10000,
            sortBy: 'createdAt',
            sortDir: 'desc',
          })
          allRowsLocal = (respAll.items || []).map(normalizeItem)

          const allIds = allRowsLocal.map((r) => r.id)
          if (allIds.length) {
            try {
              const bulkAll = await AnalyticsService.getNewsMetrics(allIds, { from: fromISO, to: toISO })
              const num = (v: any) => {
                const n = Number(v)
                return Number.isFinite(n) ? n : undefined
              }
              allRowsLocal = allRowsLocal.map((r) => {
                const b = (bulkAll as any)?.[r.id] || {}
                const open = num(b.totalOpens) ?? r.metrics.open ?? 0
                const unique = num(b.uniqueOpens) ?? r.metrics.unique
                const ack = num(b.acks) ?? r.metrics.ack ?? 0
                const reacts = num(b.reactionsTotal) ?? r.metrics.reactions ?? 0
                const comms = num(b.commentsTotal) ?? r.metrics.comments ?? 0
                const shares = num(b.sharesTotal) ?? r.metrics.shares ?? 0
                const base = num(b.recebivel) ?? r.metrics.base

                const recebeu = num((b as any).recebeuPush)
                const pushSent =
                  recebeu != null
                    ? recebeu > 0
                    : (typeof (b as any).recebeuPush === 'boolean'
                      ? (b as any).recebeuPush
                      : r.pushSent)

                return { ...r, pushSent, metrics: { ...r.metrics, open, unique, ack, reactions: reacts, comments: comms, shares, base } }
              })
            } catch (e) {
              console.warn('[overview] bulk metrics (all) falhou', e)
            }
          }

          if (channelId) {
            try {
              const newsListAll = await ContentService.list(channelId)
              const pushMapAll = new Map<string, boolean>()
              for (const n of newsListAll) pushMapAll.set(n.id, !!(n as any)?.settings?.pushNotification)
              allRowsLocal = allRowsLocal.map((r) => (pushMapAll.has(r.id) ? { ...r, pushSent: pushMapAll.get(r.id)! } : r))
            } catch (e) {
              console.warn('[overview] hidratação push via /news (all) falhou', e)
            }
          }
        } catch (e) {
          console.warn('[overview] fetch all rows falhou — usando página atual como fallback', e)
          allRowsLocal = baseRows
        }

        setRows(baseRows)
        setAllRows(allRowsLocal)
        setTotal(resp.total ?? resp.items?.length ?? 0)

        const sLocal = buildSeriesFromRows(allRowsLocal, fromISO, toISO)
        setSeriesDaily(sLocal)

        const p = (resp as any).pushLatency ?? {}
        setPushLatency({
          cdf: Array.isArray(p.cdf) ? p.cdf.map((q: any) => ({ x: Number(q.x), y: Number(q.y) })) : [],
          histogram: Array.isArray(p.histogram) ? p.histogram.map((h: any) => ({ label: String(h.label), count: Number(h.count) })) : [],
          summary: { p50: p?.summary?.p50 ?? null, p90: p?.summary?.p90 ?? null, avg: p?.summary?.avg ?? null },
        })
        return
      }

      // CASO 2: nenhum espaço selecionado -> agregar TODOS os espaços permitidos
      if (!spaces.length) {
        // ainda não carregou a lista de espaços — segura estados "vazios" até carregar
        setRows([])
        setAllRows([])
        setTotal(0)
        setSeriesDaily([])
        setPushLatency({ cdf: [], histogram: [], summary: { p50: null, p90: null, avg: null } })
        return
      }

      const perSpace = await Promise.all(
        spaces.map((s) =>
          AnalyticsService.newsOverview({
            from: fromISO,
            to: toISO,
            spaceId: s.id,
            excludeDeleted: true,
            page: 1,
            pageSize: 10000,
            sortBy: 'createdAt',
            sortDir: 'desc',
          }).catch((e: any) => {
            console.warn('[overview] espaço', s.id, 'falhou', e)
            return { items: [] }
          })
        )
      )

      let allRowsLocal: NewsOverviewItem[] = perSpace.flatMap((r: any) => (r?.items || []).map(normalizeItem))

      // bulk metrics para TODOS IDs (agregado de todos os espaços)
      const allIds = allRowsLocal.map((r) => r.id)
      if (allIds.length) {
        try {
          const bulkAll = await AnalyticsService.getNewsMetrics(allIds, { from: fromISO, to: toISO })
          const num = (v: any) => {
            const n = Number(v)
            return Number.isFinite(n) ? n : undefined
          }
          allRowsLocal = allRowsLocal.map((r) => {
            const b = (bulkAll as any)?.[r.id] || {}
            const open = num(b.totalOpens) ?? r.metrics.open ?? 0
            const unique = num(b.uniqueOpens) ?? r.metrics.unique
            const ack = num(b.acks) ?? r.metrics.ack ?? 0
            const reacts = num(b.reactionsTotal) ?? r.metrics.reactions ?? 0
            const comms = num(b.commentsTotal) ?? r.metrics.comments ?? 0
            const shares = num(b.sharesTotal) ?? r.metrics.shares ?? 0
            const base = num(b.recebivel) ?? r.metrics.base

            const recebeu = num((b as any).recebeuPush)
            const pushSent =
              recebeu != null
                ? recebeu > 0
                : (typeof (b as any).recebeuPush === 'boolean'
                  ? (b as any).recebeuPush
                  : r.pushSent)

            return { ...r, pushSent, metrics: { ...r.metrics, open, unique, ack, reactions: reacts, comments: comms, shares, base } }
          })
        } catch (e) {
          console.warn('[overview] bulk metrics (all spaces) falhou', e)
        }
      }

      // ordenar e paginar no cliente
      const sorted = [...allRowsLocal].sort(compareRows)
      const totalLocal = sorted.length
      const start = Math.max(0, (page - 1) * pageSize)
      const end = Math.min(totalLocal, start + pageSize)
      const pageRows = sorted.slice(start, end)

      setRows(pageRows)
      setAllRows(allRowsLocal)
      setTotal(totalLocal)
      setSeriesDaily(buildSeriesFromRows(allRowsLocal, fromISO, toISO))

      // Latência agregada entre espaços: omitimos (depende do backend por espaço)
      setPushLatency({ cdf: [], histogram: [], summary: { p50: null, p90: null, avg: null } })
    } catch (e: any) {
      console.error(e)
      setError(e?.message ?? 'Erro carregando overview')
      setRows([])
      setAllRows([])
      setTotal(0)
      setSeriesDaily([])
      setPushLatency({ cdf: [], histogram: [], summary: { p50: null, p90: null, avg: null } })
    } finally {
      setLoading(false)
    }
  }

  // Recarregar ao mudar filtros + após lista de espaços carregar (para o modo "todos os espaços")
  useEffect(() => {
    fetchOverview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId, channelId, sortBy, sortDir, page, pageSize, fromISO, toISO, spaces])

  const toggleSort = (col: OverviewSortBy) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(col)
      setSortDir('desc')
    }
    setPage(1)
  }

  const pages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)))

  // === KPIs do PERÍODO (somatório) ===
  const periodTotals = useMemo(() => {
    const t = { posts: 0, open: 0, unique: 0, reactions: 0, comments: 0, shares: 0, ack: 0 }
    t.posts = allRows.length
    for (const r of allRows) {
      t.open += Number(r.metrics.open ?? 0)
      t.unique += Number(r.metrics.unique ?? 0)
      t.reactions += Number(r.metrics.reactions ?? 0)
      t.comments += Number(r.metrics.comments ?? 0)
      t.shares += Number(r.metrics.shares ?? 0)
      t.ack += Number((r.metrics as any).ack ?? 0)
    }
    return t
  }, [allRows])

  // Data final inclusiva (toISO é exclusivo)
  const displayToISO = useMemo(
    () => formatISO(addDays(new Date(toISO), -1), { representation: 'date' }),
    [toISO]
  )

  // Séries para o gráfico principal
  const baseActivitySeries = [
    { key: 'posts', name: 'Novos posts', data: seriesDaily.map((d) => ({ x: new Date(`${d.date}T00:00:00`).getTime(), y: d.posts ?? 0 })) },
    { key: 'open', name: 'Visitas', data: seriesDaily.map((d) => ({ x: new Date(`${d.date}T00:00:00`).getTime(), y: d.opens ?? 0 })) },
    { key: 'unique', name: 'Vis. únicas', data: seriesDaily.map((d) => ({ x: new Date(`${d.date}T00:00:00`).getTime(), y: d.uniqueOpens ?? 0 })) },
    { key: 'reactions', name: 'Reações', data: seriesDaily.map((d) => ({ x: new Date(`${d.date}T00:00:00`).getTime(), y: d.reactions ?? 0 })) },
    { key: 'comments', name: 'Comentários', data: seriesDaily.map((d) => ({ x: new Date(`${d.date}T00:00:00`).getTime(), y: d.comments ?? 0 })) },
    { key: 'shares', name: 'Compart.', data: seriesDaily.map((d) => ({ x: new Date(`${d.date}T00:00:00`).getTime(), y: d.shares ?? 0 })) },
    { key: 'ack', name: 'ACKs', data: seriesDaily.map((d) => ({ x: new Date(`${d.date}T00:00:00`).getTime(), y: (d as any).acks ?? (d as any).ack ?? 0 })) },
  ] as const

  const activitySeries = useMemo(() => {
    if (!hoveredMetric) return baseActivitySeries
    return baseActivitySeries.filter((s) => s.key === hoveredMetric)
  }, [hoveredMetric, seriesDaily]) as any

  const activityOptions: ApexOptions = React.useMemo(
    () => ({
      chart: { type: 'area', height: 360, toolbar: { show: false } },
      stroke: { curve: 'smooth', width: 3 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 0.2, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] } },
      legend: { position: 'bottom' },
      xaxis: { type: 'datetime' },
      title: { text: 'Atividade de conteúdos' },
      dataLabels: { enabled: false },
      colors: (activitySeries as any[]).map((s: any) => COLOR_BY_KEY[s.key as keyof typeof COLOR_BY_KEY]),
    }),
    [activitySeries, seriesDaily],
  )

  // Ranking por canal (métrica selecionada) — quando nenhum espaço estiver selecionado,
  // nomes podem aparecer como ID (sem catálogo de canais de todos os espaços).
  const byChannel = useMemo(() => {
    const map = new Map<string, number>()
    for (const it of allRows) {
      const key = it.channelId
      const v = channelMetric === 'unique' ? (it.metrics.unique ?? 0) : (it.metrics as any)[channelMetric] ?? 0
      map.set(key, (map.get(key) || 0) + v)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12)
  }, [allRows, channelMetric])

  const channelsOptions: ApexOptions = {
    chart: { type: 'bar', height: 360, toolbar: { show: false } },
    title: { text: 'Top canais' },
    plotOptions: { bar: { horizontal: true, barHeight: '45%' } },
    xaxis: { categories: byChannel.map(([id]) => chName(id)) },
    dataLabels: { enabled: true },
    legend: { show: false },
    colors: ['#F6C000'],
  }
  const channelsSeries = [
    {
      name: (
        {
          open: 'Visitas',
          unique: 'Vis. únicas',
          reactions: 'Reações',
          comments: 'Comentários',
          shares: 'Compart.',
        } as any
      )[channelMetric],
      data: byChannel.map(([, v]) => v),
    },
  ]

  const postsWithInteraction = allRows.filter((r) => (r.metrics.reactions + r.metrics.comments + r.metrics.shares) > 0).length
  const donutOptions: ApexOptions = {
    chart: { type: 'donut', height: 320 },
    legend: { position: 'bottom' },
    title: { text: 'Interações' },
    labels: ['Com interação', 'Sem interação'],
    colors: ['#3E97FF', '#B5B5C3'],
    dataLabels: {
      enabled: true,
      formatter: (_val: number, opts: any) => {
        const count = opts.w.config.series[opts.seriesIndex]
        return `${count}`
      },
    },
  }
  const donutSeries = [postsWithInteraction, Math.max(0, allRows.length - postsWithInteraction)]

  // === EXPORTS (refletem exatamente o que aparece na tela) ===
  const exportTableCsv = () => {
    const cols = [
      { key: 'title', label: 'Título' },
      { key: 'visits', label: 'Visitas' },
      { key: 'visitors', label: 'Vis. únicas' },
      { key: 'reactions', label: 'Reações' },
      { key: 'comments', label: 'Comentários' },
      { key: 'shares', label: 'Compart.' },
      { key: 'push', label: 'Push' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Criado em' },
    ]
    const rowsCsv = rows.map((r) => ({
      title: r.title || '(sem título)',
      visits: r.metrics.open,
      visitors: r.metrics.unique ?? '',
      reactions: r.metrics.reactions,
      comments: r.metrics.comments,
      shares: r.metrics.shares,
      push: r.pushSent === true ? 'Sim' : 'Não',
      status: r.publishedAt || r.isPublished ? 'Publicado' : 'Rascunho',
      createdAt: new Date(r.createdAt).toISOString(),
    }))
    const blob = exportTablesToCsv(
      [{ title: 'Conteúdos', sheetName: 'Conteúdos', columns: cols as any, rows: rowsCsv as any } as any],
      ';',
    )
    downloadBlob(blob, `conteudos-overview.csv`)
  }

  const exportTimeSeriesCsv = () => {
    const cols = [
      { key: 'date', label: 'Data' },
      { key: 'posts', label: 'Novos posts' },
      { key: 'opens', label: 'Visitas' },
      { key: 'uniqueOpens', label: 'Vis. únicas' },
      { key: 'reactions', label: 'Reações' },
      { key: 'comments', label: 'Comentários' },
      { key: 'shares', label: 'Compart.' },
      { key: 'acks', label: 'ACKs' },
    ]
    const rowsCsv = (seriesDaily || []).map((d) => ({
      date: d.date,
      posts: d.posts ?? 0,
      opens: d.opens ?? 0,
      uniqueOpens: d.uniqueOpens ?? 0,
      reactions: d.reactions ?? 0,
      comments: d.comments ?? 0,
      shares: d.shares ?? 0,
      acks: (d as any).acks ?? (d as any).ack ?? 0,
    }))
    const blob = exportTablesToCsv(
      [{ title: 'Série (período)', sheetName: 'Série', columns: cols as any, rows: rowsCsv as any } as any],
      ';',
    )
    downloadBlob(blob, `conteudos-overview-serie.csv`)
  }

  const fmtInt = (n: number | undefined) => (typeof n === 'number' ? n : '—')

  const goToStats = (id: string) => {
    navigate(`/contents/${id}/stats`)
  }

  return (
    <div className="app-container container-xxl">
      <div className="app-page" id="kt_app_page">
        <AsideDefault />
        <Content>
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-6">
            <div className="d-flex flex-column">
              <h2 className="fw-bold m-0">Estatísticas gerais de conteúdos</h2>
              {(spaceId || channelId) && (
                <div className="text-muted fs-8 mt-1">
                  {spaceId ? spName(spaceId) : ''}
                  {spaceId && channelId ? ' | ' : ''}
                  {channelId ? chName(channelId) : ''}
                </div>
              )}
            </div>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              {/* ====== Filtros de período ====== */}
              <div className="btn-group me-2" role="group" aria-label="Período">
                {/* Sem "Hoje" */}
                <button className={`btn btn-light ${datePreset === '7d' ? 'active' : ''}`} onClick={() => applyPreset('7d')}>7 dias</button>
                <button className={`btn btn-light ${datePreset === '14d' ? 'active' : ''}`} onClick={() => applyPreset('14d')}>14 dias</button>
                <button className={`btn btn-light ${datePreset === '30d' ? 'active' : ''}`} onClick={() => applyPreset('30d')}>30 dias</button>
                <button className={`btn btn-light ${datePreset === '60d' ? 'active' : ''}`} onClick={() => applyPreset('60d')}>60 dias</button>
                <button className={`btn btn-light ${datePreset === '90d' ? 'active' : ''}`} onClick={() => applyPreset('90d')}>90 dias</button>
                <button className={`btn btn-light ${datePreset === 'custom' ? 'active' : ''}`} onClick={() => setDatePreset('custom')}>Personalizar</button>
              </div>
              {datePreset === 'custom' && (
                <div className="d-flex align-items-center gap-2 me-3">
                  <input type="date" className="form-control" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                  <span>—</span>
                  <input type="date" className="form-control" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
                  <button className="btn btn-primary" onClick={applyCustomRange}>Aplicar</button>
                </div>
              )}

              {/* ====== Espaços/Canais ====== */}
              <select
                className="form-select"
                style={{ width: 240 }}
                value={spaceId ?? ''}
                onChange={(e) => {
                  setSpaceId(e.target.value || null)
                  setPage(1)
                }}
              >
                <option value="">Todos os espaços</option>
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                className="form-select"
                style={{ width: 240 }}
                value={channelId ?? ''}
                disabled={!spaceId}
                onChange={(e) => {
                  setChannelId(e.target.value || null)
                  setPage(1)
                }}
              >
                <option value="">{spaceId ? 'Todos os canais do espaço' : '— escolha o espaço para filtrar canais —'}</option>
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                className="form-select"
                style={{ width: 120 }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}/página
                  </option>
                ))}
              </select>
              <button className="btn btn-light" onClick={exportTableCsv} disabled={loading || !rows.length}>
                CSV (Tabela)
              </button>
              <button className="btn btn-light" onClick={exportTimeSeriesCsv} disabled={loading || !seriesDaily.length}>
                CSV (Série)
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="row g-6 mb-6">
            <div className="col-md-2">
              <div className="card">
                <div className="card-body">
                  <div className="fs-7 text-muted">Posts</div>
                  <div className="fs-2 fw-bold">{fmtInt(periodTotals.posts)}</div>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card">
                <div className="card-body">
                  <div className="fs-7 text-muted">Visitas</div>
                  <div className="fs-2 fw-bold">{fmtInt(periodTotals.open)}</div>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card">
                <div className="card-body">
                  <div className="fs-7 text-muted">Vis. únicas</div>
                  <div className="fs-2 fw-bold">{fmtInt(periodTotals.unique)}</div>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card">
                <div className="card-body">
                  <div className="fs-7 text-muted">Reações</div>
                  <div className="fs-2 fw-bold">{fmtInt(periodTotals.reactions)}</div>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card">
                <div className="card-body">
                  <div className="fs-7 text-muted">Comentários</div>
                  <div className="fs-2 fw-bold">{fmtInt(periodTotals.comments)}</div>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card">
                <div className="card-body">
                  <div className="fs-7 text-muted">Compart.</div>
                  <div className="fs-2 fw-bold">{fmtInt(periodTotals.shares)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico principal */}
          <div className="card mb-6">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <div className="fw-bold">Atividade no período</div>
                  <div className="text-muted fs-8">{isoDate(fromISO)} — {displayToISO}</div>
                </div>
                <div className="d-flex gap-2">
                  {(['posts', 'open', 'unique', 'reactions', 'comments', 'shares', 'ack'] as const).map((key) => (
                    <button
                      key={key}
                      className={`btn btn-sm ${hoveredMetric === key ? 'btn-primary' : 'btn-light'}`}
                      onClick={() => setHoveredMetric((m) => (m === key ? null : key))}
                    >
                      {({ posts: 'Posts', open: 'Visitas', unique: 'Vis. únicas', reactions: 'Reações', comments: 'Comentários', shares: 'Compart.', ack: 'ACKs' } as any)[key]}
                    </button>
                  ))}
                </div>
              </div>
              <ReactApexChart options={activityOptions} series={activitySeries as any} type="area" height={400} />
              {!hasAnyMetricInSeries(seriesDaily) && (
                <div className="text-center text-muted mt-4">Sem dados para o período selecionado</div>
              )}
            </div>
          </div>

          {/* Top canais + Pizza de interação */}
          <div className="row g-6 mb-6">
            <div className="col-lg-7">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between mb-4">
                    <div className="fw-bold">Top canais</div>
                    <div>
                      <select
                        className="form-select form-select-sm"
                        value={channelMetric}
                        onChange={(e) => setChannelMetric(e.target.value as any)}
                      >
                        <option value="open">Visitas</option>
                        <option value="unique">Vis. únicas</option>
                        <option value="reactions">Reações</option>
                        <option value="comments">Comentários</option>
                        <option value="shares">Compart.</option>
                      </select>
                    </div>
                  </div>
                  <ReactApexChart options={channelsOptions} series={channelsSeries as any} type="bar" height={200} />
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="card h-100">
                <div className="card-body">
                  <ReactApexChart options={donutOptions} series={donutSeries as any} type="donut" height={280} />
                  <div className="text-muted fs-8 text-center">
                    {postsWithInteraction} de {allRows.length} posts tiveram qualquer interação
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Latência de Push (se houver) */}
          {(pushLatency?.cdf?.length || pushLatency?.histogram?.length) ? (
            <div className="row g-6 mb-6">
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="fw-bold mb-3">Latência de Push — CDF</div>
                    <LatencyCdfChart
                      data={pushLatency.cdf}
                      summary={{ p50: pushLatency.summary.p50 ?? null, p90: pushLatency.summary.p90 ?? null }}
                    />
                    <div className="text-muted fs-8 mt-3">
                      P50: {pushLatency.summary.p50 ?? '—'} ms · P90: {pushLatency.summary.p90 ?? '—'} ms · Avg: {pushLatency.summary.avg ?? '—'} ms
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="fw-bold mb-3">Latência de Push — Histograma</div>
                    <LatencyHistogram data={pushLatency.histogram} />
                  </div>
                </div>
              </div>
            </div>
          ) : null}


          <div className="card">
            <div className="card-body p-4">
              <div className="table-responsive">
                <table className="table align-middle table-row-dashed gy-3 mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ minWidth: 280, cursor: 'pointer' }} onClick={() => toggleSort('title')}>Título</th>
                      <th className="text-end" style={{ cursor: 'pointer' }} onClick={() => toggleSort('open')}>Visitas</th>
                      <th className="text-end" style={{ cursor: 'pointer' }} onClick={() => toggleSort('unique')}>Vis. únicas</th>
                      <th className="text-end" style={{ cursor: 'pointer' }} onClick={() => toggleSort('reactions')}>Reações</th>
                      <th className="text-end" style={{ cursor: 'pointer' }} onClick={() => toggleSort('comments')}>Comentários</th>
                      <th className="text-end" style={{ cursor: 'pointer' }} onClick={() => toggleSort('shares')}>Compart.</th>
                      <th className="text-center" title="Push enviado">Push</th>
                      <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('createdAt')}>Criado em</th>
                      <th className="text-center">Estatísticas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9} className="text-center py-10">Carregando…</td></tr>
                    ) : error ? (
                      <tr><td colSpan={9} className="text-danger py-10 text-center">{error}</td></tr>
                    ) : rows.length === 0 ? (
                      <tr><td colSpan={9} className="text-muted py-10 text-center">Sem conteúdos para o filtro atual</td></tr>
                    ) : (
                      rows.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <div className="fw-bold">{r.title || '(sem título)'}</div>
                            <div className="text-muted fs-8">
                              {/* mostra espaço/canal quando disponível */}
                              {(r.spaceId || spaceId) ? spName(r.spaceId || spaceId!) : '—'} • {chName(r.channelId)}
                            </div>
                          </td>
                          <td className="text-end">{r.metrics.open}</td>
                          <td className="text-end">{r.metrics.unique ?? '—'}</td>
                          <td className="text-end">{r.metrics.reactions}</td>
                          <td className="text-end">{r.metrics.comments}</td>
                          <td className="text-end">{r.metrics.shares}</td>
                          <td className="text-center">
                            {r.pushSent === true ? (
                              <span className="badge badge-light-success" title="Push enviado">
                                <i className="ki-outline ki-device-mobile fs-5"></i>
                              </span>
                            ) : (
                              <span className="badge badge-light" title="Sem push">
                                <i className="ki-outline ki-device-mobile fs-5 opacity-50"></i>
                              </span>
                            )}
                          </td>
                          <td className="text-muted fs-8">{new Date(r.createdAt).toLocaleString()}</td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-light" title="Ver estatísticas" onClick={() => goToStats(r.id)}>
                              <i className="ki-outline ki-chart-line fs-5"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* paginação */}
              <div className="d-flex justify-content-between align-items-center px-4 py-3">
                <div className="text-muted fs-8">
                  Página {page} de {pages} — {total} itens
                </div>
                <div className="btn-group">
                  <button className="btn btn-light btn-sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    ‹ Anterior
                  </button>
                  <button className="btn btn-light btn-sm" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>
                    Próxima ›
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Content>
      </div>
    </div>
  )
}

export default ContentsOverviewPage