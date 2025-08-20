import * as XLSX from 'xlsx'
import type { Survey, SurveyStatisticsDto, QuestionStatisticsDto } from '@shared/types'

function safeSheetName(name: string, used: Set<string>) {
  let n = (name || 'Aba')
    .replace(/[:\\/?*\[\]]/g, ' ')   // caracteres proibidos
    .replace(/\s+/g, ' ')
    .trim()

  if (!n) n = 'Aba'
  if (n.length > 31) n = n.slice(0, 31)

  const base = n
  let i = 1
  while (used.has(n)) {
    const suffix = ` ${++i}`
    n = (base.slice(0, Math.max(0, 31 - suffix.length)) + suffix).trim()
  }
  used.add(n)
  return n
}

function aoaGeral(survey: Survey, stats: SurveyStatisticsDto) {
  const rows: any[][] = [
    ['Enquete', survey?.title || ''],
    ['Survey ID', survey?.id || ''],
    ['Total de respostas', stats.totalResponses],
  ]
  if (stats.completionRate != null) rows.push(['Conclusão (%)', stats.completionRate])
  if (stats.anonymousRate != null) rows.push(['Anônimas (%)', stats.anonymousRate])
  if (stats.windowFrom || stats.windowTo) rows.push(['Janela', stats.windowFrom || '—', stats.windowTo || '—'])
  if (stats.npsOverall) {
    rows.push([], ['NPS Geral', stats.npsOverall.npsScore])
    rows.push(['Promotores', stats.npsOverall.promoters])
    rows.push(['Passivos', stats.npsOverall.passives])
    rows.push(['Detratores', stats.npsOverall.detractors])
  }
  if (stats.starsAverage != null || stats.scaleAverage != null) {
    rows.push([],
      ['Média (stars)', stats.starsAverage ?? '—'],
      ['Média (scale)', stats.scaleAverage ?? '—'],
    )
  }
  if (stats.responsesOverTime?.length) {
    rows.push([], ['Respostas por dia', ''])
    rows.push(['Data', 'Qtde'])
    stats.responsesOverTime.forEach(r => rows.push([r.date, r.count]))
  }
  if (stats.responsesHeatmap?.length) {
    rows.push([], ['Heatmap dia x hora (0=Dom, 6=Sáb)'])
    rows.push(['Dia', 'Hora', 'Qtde'])
    stats.responsesHeatmap.forEach(h => rows.push([h.day, h.hour, h.count]))
  }
  return rows
}

function aoaPorPergunta(q: QuestionStatisticsDto) {
  const aoa: any[][] = []
  aoa.push(['Pergunta', q.questionText || q.questionId])
  aoa.push(['Tipo', q.type || '—'])
  aoa.push(['Respondentes', q.totalRespondents])
  aoa.push(['Respondidas', q.answeredCount ?? 0])
  aoa.push(['Puladas', q.skippedCount ?? 0])
  aoa.push([])

  if ((q.type === 'single' || q.type === 'multi') && q.options) {
    aoa.push(['Opção', 'Contagem', 'Percentual'])
    Object.keys(q.options).forEach(opt => {
      aoa.push([opt, q.options![opt], q.optionsPct?.[opt] ?? ''])
    })
  } else if ((q.type === 'stars' || q.type === 'scale' || q.type === 'nps') && q.distribution) {
    aoa.push(['Valor', 'Qtde'])
    Object.keys(q.distribution).map(Number).sort((a, b) => a - b)
      .forEach(v => aoa.push([v, q.distribution![v]]))
    aoa.push([])

    if (q.average != null) aoa.push(['Média', q.average])
    if (q.median != null) aoa.push(['Mediana', q.median])
    if (q.p25 != null) aoa.push(['P25', q.p25])
    if (q.p75 != null) aoa.push(['P75', q.p75])
    if (q.stddev != null) aoa.push(['Desvio Padrão', q.stddev])
    if (q.min != null) aoa.push(['Mínimo', q.min])
    if (q.max != null) aoa.push(['Máximo', q.max])

    if (q.type === 'nps') {
      aoa.push([])
      if (q.npsScore != null) aoa.push(['NPS', q.npsScore])
      if (q.promoters != null) aoa.push(['Promotores', q.promoters])
      if (q.passives != null) aoa.push(['Passivos', q.passives])
      if (q.detractors != null) aoa.push(['Detratores', q.detractors])
    }
  } else if (q.type === 'text') {
    if (q.topWords?.length) {
      aoa.push(['Top palavras', 'Frequência'])
      q.topWords.forEach(w => aoa.push([w.word, w.count]))
      aoa.push([])
    }
    if (q.bigrams?.length) {
      aoa.push(['Top bigramas', 'Frequência'])
      q.bigrams.forEach(b => aoa.push([b.phrase, b.count]))
      aoa.push([])
    }
    if (q.trigrams?.length) {
      aoa.push(['Top trigramas', 'Frequência'])
      q.trigrams.forEach(t => aoa.push([t.phrase, t.count]))
      aoa.push([])
    }
    aoa.push(['#', 'Resposta'])
    ;(q.answers ?? []).forEach((a, i) => aoa.push([i + 1, a]))
  }

  return aoa
}

export function exportSurveyXlsx(survey: Survey, stats: SurveyStatisticsDto, filename: string) {
  const wb = XLSX.utils.book_new()
  const used = new Set<string>()

  // Geral
  const shGeral = XLSX.utils.aoa_to_sheet(aoaGeral(survey, stats))
  XLSX.utils.book_append_sheet(wb, shGeral, safeSheetName('Geral', used))

  // Uma aba por pergunta
  stats.questions.forEach((q, i) => {
    const base = q.questionText || `Pergunta ${i + 1}`
    const name = safeSheetName(`${i + 1} ${base}`, used)
    const sh = XLSX.utils.aoa_to_sheet(aoaPorPergunta(q))
    XLSX.utils.book_append_sheet(wb, sh, name)
  })

  XLSX.writeFile(wb, filename)
}