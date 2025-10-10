/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Survey, SurveyStatisticsDto, QuestionStatisticsDto } from '@shared/types'
import {
    ExportTable,
    exportTablesToXlsx,
    exportSectionsAsPdf,
    formatDatePt,
} from 'src/app/core/utils/exporter'

/** ---------- builders ---------- */

function buildSummaryTable(survey: Survey, stats: SurveyStatisticsDto): ExportTable {
    return {
        title: 'Resumo',
        sheetName: 'Geral',
        columns: [
            { key: 'metric', label: 'Métrica' },
            { key: 'value', label: 'Valor' },
        ],
        rows: [
            { metric: 'Enquete', value: survey?.title || '' },
            { metric: 'Survey ID', value: survey?.id || '' },
            { metric: 'Total de respostas', value: String(stats.totalResponses ?? 0) },
            ...(stats.completionRate != null ? [{ metric: 'Conclusão (%)', value: String(stats.completionRate) }] : []),
            ...(stats.anonymousRate != null ? [{ metric: 'Anônimas (%)', value: String(stats.anonymousRate) }] : []),
            ...(stats.windowFrom || stats.windowTo
                ? [{ metric: 'Janela', value: `${formatDatePt(stats.windowFrom) || '—'} → ${formatDatePt(stats.windowTo) || '—'}` }]
                : []),
            ...(stats.npsOverall
                ? [
                    { metric: 'NPS Geral', value: String(stats.npsOverall.npsScore ?? '') },
                    { metric: 'Promotores', value: String(stats.npsOverall.promoters ?? '') },
                    { metric: 'Passivos', value: String(stats.npsOverall.passives ?? '') },
                    { metric: 'Detratores', value: String(stats.npsOverall.detractors ?? '') },
                ]
                : []),
            ...(stats.starsAverage != null || stats.scaleAverage != null
                ? [
                    { metric: 'Média (stars)', value: String(stats.starsAverage ?? '—') },
                    { metric: 'Média (scale)', value: String(stats.scaleAverage ?? '—') },
                ]
                : []),
        ],
    }
}

function buildResponsesOverTimeTable(stats: SurveyStatisticsDto): ExportTable | null {
    if (!stats.responsesOverTime?.length) return null
    return {
        title: 'Respostas por dia',
        sheetName: 'Timeseries',
        columns: [
            { key: 'date', label: 'Data' },
            { key: 'count', label: 'Qtde' },
        ],
        rows: stats.responsesOverTime.map((r) => ({ date: r.date, count: r.count })),
    }
}

function buildHeatmapTable(stats: SurveyStatisticsDto): ExportTable | null {
    if (!stats.responsesHeatmap?.length) return null
    return {
        title: 'Heatmap (dia x hora)',
        sheetName: 'Heatmap',
        columns: [
            { key: 'day', label: 'Dia' },
            { key: 'hour', label: 'Hora' },
            { key: 'count', label: 'Qtde' },
        ],
        rows: stats.responsesHeatmap.map((h) => ({ day: h.day, hour: h.hour, count: h.count })),
    }
}

function buildQuestionTables(q: QuestionStatisticsDto, idx: number): ExportTable[] {
    const prefix = `${idx + 1} `
    if ((q.type === 'single' || q.type === 'multi') && q.options) {
        const labels = Object.keys(q.options)
        return [
            {
                title: q.questionText || q.questionId,
                sheetName: `${prefix}Opções`,
                columns: [
                    { key: 'option', label: 'Opção' },
                    { key: 'count', label: 'Contagem' },
                    { key: 'pct', label: 'Percentual' },
                ],
                rows: labels.map((opt) => ({
                    option: opt,
                    count: q.options![opt],
                    pct: q.optionsPct?.[opt] ?? '',
                })),
            },
        ]
    }
    if ((q.type === 'stars' || q.type === 'scale') && q.distribution) {
        const keys = Object.keys(q.distribution).map(Number).sort((a, b) => a - b)
        return [
            {
                title: q.questionText || q.questionId,
                sheetName: `${prefix}Distribuição`,
                columns: [
                    { key: 'value', label: 'Valor' },
                    { key: 'count', label: 'Qtde' },
                ],
                rows: keys.map((k) => ({ value: String(k), count: q.distribution![k] })),
            },
            {
                title: q.questionText || q.questionId,
                sheetName: `${prefix}Resumo`,
                columns: [
                    { key: 'metric', label: 'Métrica' },
                    { key: 'value', label: 'Valor' },
                ],
                rows: [
                    ...(q.average != null ? [{ metric: 'Média', value: String(q.average) }] : []),
                    ...(q.median != null ? [{ metric: 'Mediana', value: String(q.median) }] : []),
                    ...(q.p25 != null ? [{ metric: 'P25', value: String(q.p25) }] : []),
                    ...(q.p75 != null ? [{ metric: 'P75', value: String(q.p75) }] : []),
                    ...(q.stddev != null ? [{ metric: 'Desvio Padrão', value: String(q.stddev) }] : []),
                    ...(q.min != null ? [{ metric: 'Mínimo', value: String(q.min) }] : []),
                    ...(q.max != null ? [{ metric: 'Máximo', value: String(q.max) }] : []),
                ],
            },
        ]
    }
    if (q.type === 'nps') {
        return [
            {
                title: q.questionText || q.questionId,
                sheetName: `${prefix}NPS`,
                columns: [
                    { key: 'metric', label: 'Métrica' },
                    { key: 'value', label: 'Valor' },
                ],
                rows: [
                    ...(q.npsScore != null ? [{ metric: 'NPS', value: String(q.npsScore) }] : []),
                    ...(q.promoters != null ? [{ metric: 'Promotores', value: String(q.promoters) }] : []),
                    ...(q.passives != null ? [{ metric: 'Passivos', value: String(q.passives) }] : []),
                    ...(q.detractors != null ? [{ metric: 'Detratores', value: String(q.detractors) }] : []),
                ],
            },
        ]
    }
    if (q.type === 'text') {
        const base: ExportTable[] = []
        if (q.topWords?.length) {
            base.push({
                title: q.questionText || q.questionId,
                sheetName: `${prefix}Top palavras`,
                columns: [
                    { key: 'term', label: 'Termo' },
                    { key: 'count', label: 'Frequência' },
                ],
                rows: q.topWords.map((w) => ({ term: w.word, count: w.count })),
            })
        }
        if (q.bigrams?.length) {
            base.push({
                title: q.questionText || q.questionId,
                sheetName: `${prefix}Bigramas`,
                columns: [
                    { key: 'phrase', label: 'Bigrama' },
                    { key: 'count', label: 'Frequência' },
                ],
                rows: q.bigrams.map((b) => ({ phrase: b.phrase, count: b.count })),
            })
        }
        if (q.trigrams?.length) {
            base.push({
                title: q.questionText || q.questionId,
                sheetName: `${prefix}Trigramas`,
                columns: [
                    { key: 'phrase', label: 'Trigrama' },
                    { key: 'count', label: 'Frequência' },
                ],
                rows: q.trigrams.map((t) => ({ phrase: t.phrase, count: t.count })),
            })
        }
        const answers = (q.answers ?? []).map((a, i) => ({ idx: i + 1, answer: a }))
        base.push({
            title: q.questionText || q.questionId,
            sheetName: `${prefix}Respostas`,
            columns: [
                { key: 'idx', label: '#' },
                { key: 'answer', label: 'Resposta' },
            ],
            rows: answers,
        })
        return base
    }
    return [
        {
            title: q.questionText || q.questionId,
            sheetName: `${prefix}Sem dados`,
            columns: [{ key: 'info', label: 'Info' }],
            rows: [{ info: 'Sem dados.' }],
        },
    ]
}

/** ---------- API público para export ---------- */

export async function exportSurveyXlsxGlobal(survey: Survey, stats: SurveyStatisticsDto, filename: string) {
    const tables: ExportTable[] = [buildSummaryTable(survey, stats)]
    const ts = buildResponsesOverTimeTable(stats)
    if (ts) tables.push(ts)
    const hm = buildHeatmapTable(stats)
    if (hm) tables.push(hm)
    stats.questions.forEach((q, idx) => {
        tables.push(...buildQuestionTables(q, idx))
    })
    exportTablesToXlsx(tables, filename)
}

export async function exportSurveyPanelPdfGlobal(containerId: string, filename: string) {
    await exportSectionsAsPdf(containerId, filename, { margin: 36, scale: 3, orientation: 'p', format: 'a4' })
}