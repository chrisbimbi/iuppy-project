/* eslint-disable @typescript-eslint/no-explicit-any */
import { News as Content } from '@shared/types'
import {
  ExportTable,
  exportTablesToCsv,
  exportTablesToXlsx,
  exportContainerAsPdf,
  formatDatePt,
  formatPercent,
  downloadBlob,
} from 'src/app/core/utils/exporter'

/** ========= News list ========= */
export type NewsExportItem = Pick<
  Content,
  'id' | 'title' | 'subtitle' | 'hashtags' | 'isPublished' | 'createdAt' | 'updatedAt'
> & { channelName?: string | null }

function buildNewsTable(items: NewsExportItem[], title = 'Conteúdos'): ExportTable {
  return {
    title,
    sheetName: 'Conteúdos',
    columns: [
      { key: 'title', label: 'Título' },
      { key: 'subtitle', label: 'Subtítulo' },
      { key: 'hashtags', label: 'Hashtags' },
      { key: 'status', label: 'Status' },
      { key: 'channel', label: 'Canal' },
      { key: 'createdAt', label: 'Criado' },
      { key: 'updatedAt', label: 'Atualizado' },
    ],
    rows: items.map((i) => ({
      title: i.title ?? '-',
      subtitle: i.subtitle ?? '-',
      hashtags: i.hashtags?.join(', ') ?? '-',
      status: i.isPublished ? 'Publicado' : 'Rascunho',
      channel: i.channelName ?? '-',
      createdAt: formatDatePt(i.createdAt),
      updatedAt: formatDatePt(i.updatedAt),
    })),
  }
}

export function exportNewsCsv(items: NewsExportItem[], filename = 'conteudos.csv') {
  const blob = exportTablesToCsv(buildNewsTable(items))
  downloadBlob(blob, filename)
}
export function exportNewsXlsx(items: NewsExportItem[], filename = 'conteudos.xlsx') {
  exportTablesToXlsx(buildNewsTable(items), filename)
}

/** ========= Overview ========= */
export type OverviewTotals = {
  recebiveis: number
  uniqueOpens: number
  acks: number
  reactions: number
  comments: number
  shares: number
  publishedCount: number
}
export type OverviewRates = {
  avgOpenRate: number
  avgAckRate: number
  avgReactionRate: number
  avgCommentRate: number
  avgShareRate: number
}
export type OverviewItem = {
  id: string
  title: string
  hashtags?: string[] | null
  isPublished?: boolean
  channelName?: string | null
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
}

function buildOverviewTables(args: {
  fromISO: string
  toISO: string
  spaceName?: string | null
  channelName?: string | null
  totals: OverviewTotals
  rates: OverviewRates
  items?: OverviewItem[]
}): ExportTable[] {
  const { fromISO, toISO, spaceName, channelName, totals, rates, items = [] } = args
  const summary: ExportTable = {
    title: 'Resumo',
    sheetName: 'Resumo',
    columns: [
      { key: 'metric', label: 'Métrica' },
      { key: 'value', label: 'Valor' },
    ],
    rows: [
      { metric: 'Período', value: `${formatDatePt(fromISO)} → ${formatDatePt(toISO)}` },
      { metric: 'Espaço', value: spaceName ?? '-' },
      { metric: 'Canal', value: channelName ?? '-' },
      { metric: 'Publicações', value: String(totals.publishedCount ?? 0) },
      { metric: 'Recebíveis (base)', value: String(totals.recebiveis ?? 0) },
      { metric: 'Aberturas únicas', value: String(totals.uniqueOpens ?? 0) },
      { metric: 'Acks', value: String(totals.acks ?? 0) },
      { metric: 'Reações', value: String(totals.reactions ?? 0) },
      { metric: 'Comentários', value: String(totals.comments ?? 0) },
      { metric: 'Compartilhamentos', value: String(totals.shares ?? 0) },
      { metric: 'Open rate (média)', value: formatPercent(rates.avgOpenRate ?? 0) },
      { metric: 'Ack rate (média)', value: formatPercent(rates.avgAckRate ?? 0) },
      { metric: 'Reação / base (média)', value: formatPercent(rates.avgReactionRate ?? 0) },
      { metric: 'Comentário / base (média)', value: formatPercent(rates.avgCommentRate ?? 0) },
      { metric: 'Share / base (média)', value: formatPercent(rates.avgShareRate ?? 0) },
    ],
  }

  const list: ExportTable = {
    title: 'Publicações no período',
    sheetName: 'Publicações',
    columns: [
      { key: 'title', label: 'Título' },
      { key: 'hashtags', label: 'Hashtags' },
      { key: 'status', label: 'Status' },
      { key: 'channel', label: 'Canal' },
      { key: 'createdAt', label: 'Criado' },
      { key: 'updatedAt', label: 'Atualizado' },
    ],
    rows: items.map((i) => ({
      title: i.title ?? '-',
      hashtags: i.hashtags?.join(', ') ?? '-',
      status: i.isPublished ? 'Publicado' : 'Rascunho',
      channel: i.channelName ?? '-',
      createdAt: formatDatePt(i.createdAt),
      updatedAt: formatDatePt(i.updatedAt),
    })),
  }

  return [summary, list]
}

export function exportOverviewCsv(args: Parameters<typeof buildOverviewTables>[0], filename = 'overview.csv') {
  const blob = exportTablesToCsv(buildOverviewTables(args))
  downloadBlob(blob, filename)
}
export function exportOverviewXlsx(args: Parameters<typeof buildOverviewTables>[0], filename = 'overview.xlsx') {
  exportTablesToXlsx(buildOverviewTables(args), filename)
}

/** ========= PDF (captura do painel/render) ========= */
export function exportOverviewPanelAsPdf(containerId: string, filename = 'overview.pdf') {
  return exportContainerAsPdf(containerId, filename, { margin: 36, scale: 3, orientation: 'l' })
}
export function exportNewsPanelAsPdf(containerId: string, filename = 'conteudo.pdf') {
  return exportContainerAsPdf(containerId, filename, { margin: 36, scale: 3, orientation: 'p' })
}