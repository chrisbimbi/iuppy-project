import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageTitle } from 'src/layout/core'
import { AsideDefault } from 'src/layout/components/aside/AsideDefault'
import { Content } from 'src/layout/components/Content'
import { useAuth } from 'src/app/modules/auth'
import { SurveyService } from '../../services/surveys.service'
import { Survey, SurveyStatisticsDto } from '@shared/types'

import ReactApexChart from 'react-apexcharts'

// utils de export
import { exportSurveyXlsx } from '../../utils/xls'
import { exportSectionsAsPdf } from '../../utils/pdf'
import WordCloudCanvas from '../../components/WordCloudCanvas'

type StatsFilters = {
  from?: string
  to?: string
  onlyIdentified?: boolean
  distinctByUser?: boolean
}

const TEXT_PAGE_SIZE = 25
const PANEL_ID = 'survey-results-panel'

const toLocalInput = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return tz.toISOString().slice(0, 16)
}

const SurveyResultsPage = () => {
  const { currentUser } = useAuth()
  const companyId = currentUser!.companyId
  const { surveyId = '' } = useParams()

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [stats, setStats] = useState<SurveyStatisticsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<StatsFilters>({
    distinctByUser: false,
    onlyIdentified: false,
  })

  // estados de exportação
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingXlsx, setExportingXlsx] = useState(false)

  // paginação por pergunta (texto)
  const [pageMap, setPageMap] = useState<Record<string, number>>({})
  const setPage = (qid: string, p: number) =>
    setPageMap(prev => ({ ...prev, [qid]: p }))

  // root a ser “fotografado”
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const s = await SurveyService.getOne(companyId, surveyId)
        const st = await SurveyService.getSurveyStatistics(companyId, surveyId, filters)
        if (!mounted) return
        setSurvey(s)
        setStats(st)
        const initial: Record<string, number> = {}
        st?.questions?.forEach(q => { if (q.type === 'text') initial[q.questionId] = 1 })
        setPageMap(initial)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (companyId && surveyId) load()
    return () => { mounted = false }
  }, [companyId, surveyId, filters])

  const onApply = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const sortedTimeseries = useMemo(() => stats?.responsesOverTime ?? [], [stats])

  // Exportações com loading
  const handleExportPDF = async () => {
    try {
      setExportingPdf(true)
      await exportSectionsAsPdf(PANEL_ID, `survey-${surveyId}-painel.pdf`, {
        margin: 36,
        scale: 3,
        orientation: 'p',
        format: 'a4',
      })
    } catch (err: any) {
      console.error('Erro ao exportar PDF', err)
      alert('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setExportingPdf(false)
    }
  }

  const handleExportXLSX = async () => {
    if (!survey || !stats) return
    try {
      setExportingXlsx(true)
      await Promise.resolve(exportSurveyXlsx(survey, stats, `survey-${surveyId}-relatorio.xlsx`))
    } catch (err: any) {
      console.error('Erro ao exportar XLSX', err)
      alert('Não foi possível gerar o XLSX. Tente novamente.')
    } finally {
      setExportingXlsx(false)
    }
  }

  // helpers paginação (Metronic)
  const buildPageList = (total: number, current: number) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const pages = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1])
    return Array.from(pages).filter(p => p >= 1 && p <= total).sort((a, b) => a - b)
  }

  /* --------- Apex helpers ---------- */
  const barOptions = (title: string): ApexCharts.ApexOptions => ({
    chart: { type: 'bar', height: 320, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, barHeight: '60%' } },
    dataLabels: { enabled: true },
    xaxis: { title: { text: 'Respostas' } },
    title: { text: title },
  })

  const histOptions = (title: string): ApexCharts.ApexOptions => ({
    chart: { type: 'bar', height: 320, toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: '60%' } },
    dataLabels: { enabled: true },
    xaxis: { title: { text: 'Valor' } },
    title: { text: title },
  })

  const lineOptions = (title: string): ApexCharts.ApexOptions => ({
    chart: { type: 'line', height: 320, toolbar: { show: false } },
    dataLabels: { enabled: true },
    stroke: { curve: 'smooth' },
    xaxis: { type: 'category' },
    title: { text: title },
  })

  const radialOptions = (title: string, value: number): ApexCharts.ApexOptions => ({
    chart: { type: 'radialBar', height: 300 },
    plotOptions: {
      radialBar: {
        hollow: { size: '60%' },
        dataLabels: {
          name: { show: true, fontSize: '14px' },
          value: { show: true, fontSize: '24px', formatter: v => `${v}` },
        },
      },
    },
    labels: [title],
    series: [value],
  })

  // Heatmap dia x hora (0=Dom..6=Sáb) -> mostrar Seg..Dom
  const heatmapSeries = useMemo(() => {
    const daysOrder = [1, 2, 3, 4, 5, 6, 0] // Seg..Dom
    const dayLabels: Record<number, string> = { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb' }
    const base = new Map<string, number>()
    stats?.responsesHeatmap?.forEach(h => {
      base.set(`${h.day}-${h.hour}`, h.count)
    })
    return daysOrder.map(d => ({
      name: dayLabels[d],
      data: Array.from({ length: 24 }, (_, h) => ({ x: h.toString().padStart(2, '0'), y: base.get(`${d}-${h}`) || 0 }))
    }))
  }, [stats])

  const heatmapOptions: ApexCharts.ApexOptions = {
    chart: { type: 'heatmap', toolbar: { show: false } },
    dataLabels: { enabled: false },
    plotOptions: { heatmap: { shadeIntensity: 0.5 } },
    xaxis: { title: { text: 'Hora do dia' } },
    yaxis: { title: { text: 'Dia da semana' } },
    title: { text: 'Atividade por dia x hora' },
  }

  const isExporting = exportingPdf || exportingXlsx

  return (
    <div className='app-container container-xxl'>
      <div className='app-page' id='kt_app_page'>
        <AsideDefault />
        <Content>
          <PageTitle breadcrumbs={[]}>
            Resultados da Enquete {survey ? `– ${survey.title}` : ''}
          </PageTitle>

          {/* overlay global simples enquanto exporta */}
          {isExporting && (
            <div
              className='position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center'
              style={{ zIndex: 1100, background: 'rgba(255,255,255,0.65)' }}
              aria-live='polite'
              aria-busy='true'
            >
              <div className='spinner-border' role='status' />
              <div className='mt-3 text-gray-700 fw-semibold'>
                {exportingPdf ? 'Gerando PDF…' : 'Gerando XLSX…'}
              </div>
            </div>
          )}

          {/* tudo que vai para o PDF */}
          <div id={PANEL_ID} ref={panelRef}>

            {/* ====== SEÇÃO GERAL (1ª página do PDF) ====== */}
            <section data-pdf-section>

              {/* Filtros */}
              <form className='card card-body mb-6' onSubmit={onApply}>
                <div className='row g-4 align-items-end'>
                  <div className='col-md-3'>
                    <label className='form-label'>De</label>
                    <input
                      type='datetime-local'
                      className='form-control'
                      value={toLocalInput(filters.from)}
                      onChange={e => setFilters(f => ({ ...f, from: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                    />
                  </div>
                  <div className='col-md-3'>
                    <label className='form-label'>Até</label>
                    <input
                      type='datetime-local'
                      className='form-control'
                      value={toLocalInput(filters.to)}
                      onChange={e => setFilters(f => ({ ...f, to: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                    />
                  </div>
                  <div className='col-md-3'>
                    <div className='form-check mb-2'>
                      <input
                        id='onlyIdentified'
                        type='checkbox'
                        className='form-check-input'
                        checked={!!filters.onlyIdentified}
                        onChange={e => setFilters(f => ({ ...f, onlyIdentified: e.target.checked }))}
                      />
                      <label htmlFor='onlyIdentified' className='form-check-label'>Ignorar respostas anônimas</label>
                    </div>
                    <div className='form-check'>
                      <input
                        id='distinct'
                        type='checkbox'
                        className='form-check-input'
                        checked={!!filters.distinctByUser}
                        onChange={e => setFilters(f => ({ ...f, distinctByUser: e.target.checked }))}
                      />
                      <label htmlFor='distinct' className='form-check-label'>Contar apenas última por usuário</label>
                    </div>
                  </div>
                  <div className='col-md-3 text-end'>
                    <button type='submit' className='btn btn-primary'>Aplicar</button>
                  </div>
                </div>
              </form>

              {/* Cards principais */}
              <div className='row g-6 mb-6'>
                <div className='col-md-3'>
                  <div className='card card-body'>
                    <div className='fs-7 text-muted'>Total de respostas</div>
                    <div className='fs-1 fw-bold'>{stats?.totalResponses ?? '-'}</div>
                  </div>
                </div>
                <div className='col-md-3'>
                  <div className='card card-body'>
                    <div className='fs-7 text-muted'>Conclusão (%)</div>
                    <div className='fs-1 fw-bold'>{stats?.completionRate ?? 0}%</div>
                  </div>
                </div>
                <div className='col-md-3'>
                  <div className='card card-body'>
                    <div className='fs-7 text-muted'>NPS Geral</div>
                    <div className='fs-1 fw-bold'>
                      {stats?.npsOverall ? `${stats.npsOverall.npsScore}` : '—'}
                    </div>
                  </div>
                </div>
                <div className='col-md-3'>
                  <div className='card card-body'>
                    <div className='fs-7 text-muted'>Satisfação (stars / scale)</div>
                    <div className='fs-1 fw-bold'>
                      {stats?.starsAverage != null ? stats.starsAverage.toFixed(2) : '—'} / {stats?.scaleAverage != null ? stats.scaleAverage.toFixed(2) : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Série temporal */}
              <div className='card card-body mb-8'>
                <div className='d-flex justify-content-between align-items-center mb-4'>
                  <h5 className='mb-0'>Respostas por dia</h5>
                </div>
                {sortedTimeseries.length > 0 ? (
                  <ReactApexChart
                    options={lineOptions('Respostas por dia')}
                    series={[{ name: 'Respostas', data: sortedTimeseries.map(r => ({ x: r.date, y: r.count })) }]}
                    type='line'
                    height={320}
                  />
                ) : (
                  <div className='text-center text-muted'>Sem dados no período</div>
                )}
              </div>

              {/* Heatmap */}
              {stats?.responsesHeatmap?.length ? (
                <div className='card card-body mb-8'>
                  <ReactApexChart options={heatmapOptions} series={heatmapSeries} type='heatmap' height={360} />
                </div>
              ) : null}
            </section>
            {/* ====== /SEÇÃO GERAL ====== */}

            {/* Ações de export (não entram no PDF) */}
            <div className='d-flex flex-wrap gap-3 mb-6'>
              <button
                className='btn btn-light-primary'
                onClick={handleExportXLSX}
                disabled={isExporting}
                aria-busy={exportingXlsx}
              >
                {exportingXlsx ? (
                  <>
                    <span className='spinner-border spinner-border-sm me-2 align-middle'></span>
                    Gerando XLSX…
                  </>
                ) : (
                  'Exportar XLSX (abas)'
                )}
              </button>

              <button
                className='btn btn-light'
                onClick={handleExportPDF}
                disabled={isExporting}
                aria-busy={exportingPdf}
              >
                {exportingPdf ? (
                  <>
                    <span className='spinner-border spinner-border-sm me-2 align-middle'></span>
                    Gerando PDF…
                  </>
                ) : (
                  'Exportar PDF (painel)'
                )}
              </button>
            </div>

            {/* Por pergunta */}
            <div className='mb-4'>
              <h4>Estatísticas por pergunta</h4>
            </div>

            {loading && <div className='alert alert-info'>Carregando...</div>}

            {!loading && stats?.questions?.map((q) => {
              const cardTitle = `${q.questionText}`

              // SINGLE/MULTI
              if ((q.type === 'single' || q.type === 'multi') && q.options) {
                const labels = Object.keys(q.options)
                const data = labels.map(l => q.options![l])
                return (
                  <section data-pdf-section className='card card-body mb-6' key={q.questionId}>
                    <div className='d-flex justify-content-between align-items-center mb-2'>
                      <div className='fw-semibold'>{cardTitle}</div>
                      <div className='text-muted'>
                        Respondentes: {q.totalRespondents} | Respondidas: {q.answeredCount ?? 0} | Puladas: {q.skippedCount ?? 0}
                      </div>
                    </div>
                    <ReactApexChart
                      options={{ ...barOptions(cardTitle), xaxis: { categories: labels, title: { text: 'Contagem' } } }}
                      series={[{ name: 'Respostas', data }]}
                      type='bar'
                      height={320}
                    />
                  </section>
                )
              }

              // STARS/SCALE
              if ((q.type === 'stars' || q.type === 'scale') && q.distribution) {
                const keys = Object.keys(q.distribution).map(k => Number(k)).sort((a, b) => a - b)
                const data = keys.map(k => q.distribution![k])
                return (
                  <section data-pdf-section className='card card-body mb-6' key={q.questionId}>
                    <div className='d-flex justify-content-between align-items-center mb-2'>
                      <div className='fw-semibold'>{cardTitle}</div>
                      <div className='text-muted'>
                        Média: {q.average?.toFixed(2) ?? '—'} | Mediana: {q.median ?? '—'} | P25: {q.p25 ?? '—'} | P75: {q.p75 ?? '—'} | Desv.Pad: {q.stddev?.toFixed(2) ?? '—'}
                      </div>
                    </div>
                    <ReactApexChart
                      options={{ ...histOptions(cardTitle), xaxis: { categories: keys.map(String), title: { text: 'Valor' } } }}
                      series={[{ name: 'Qtd', data }]}
                      type='bar'
                      height={320}
                    />
                  </section>
                )
              }

              // NPS
              if (q.type === 'nps' && typeof q.npsScore === 'number') {
                return (
                  <section data-pdf-section className='card card-body mb-6' key={q.questionId}>
                    <div className='d-flex justify-content-between align-items-center mb-2'>
                      <div className='fw-semibold'>{cardTitle}</div>
                      <div className='text-muted'>
                        Respondentes: {q.totalRespondents} | Respondidas: {q.answeredCount ?? 0} | Puladas: {q.skippedCount ?? 0}
                      </div>
                    </div>
                    <div className='row align-items-center'>
                      <div className='col-md-4'>
                        <ReactApexChart
                          options={radialOptions('NPS', q.npsScore!)}
                          series={[q.npsScore!]}
                          type='radialBar'
                          height={300}
                        />
                      </div>
                      <div className='col-md-8'>
                        <div className='row text-center'>
                          <div className='col'><div className='fs-2 fw-bold text-success'>{q.promoters ?? 0}</div><div className='text-muted'>Promotores</div></div>
                          <div className='col'><div className='fs-2 fw-bold text-gray-700'>{q.passives ?? 0}</div><div className='text-muted'>Passivos</div></div>
                          <div className='col'><div className='fs-2 fw-bold text-danger'>{q.detractors ?? 0}</div><div className='text-muted'>Detratores</div></div>
                        </div>
                      </div>
                    </div>
                  </section>
                )
              }

              // TEXT + WordCloud + paginação + bigrams/trigrams
              if (q.type === 'text') {
                const total = q.answers?.length ?? 0
                const totalPages = Math.max(1, Math.ceil(total / TEXT_PAGE_SIZE))
                const currentPage = pageMap[q.questionId] ?? 1
                const start = (currentPage - 1) * TEXT_PAGE_SIZE
                const end = Math.min(total, start + TEXT_PAGE_SIZE)
                const slice = (q.answers ?? []).slice(start, end)
                const pageNumbers = buildPageList(totalPages, currentPage)

                return (
                  <section data-pdf-section className='card card-body mb-6' key={q.questionId}>
                    <div className='d-flex justify-content-between align-items-center mb-2'>
                      <div className='fw-semibold'>{cardTitle}</div>
                      <div className='text-muted'>
                        Respondentes: {q.totalRespondents} | Respondidas: {q.answeredCount ?? 0} | Puladas: {q.skippedCount ?? 0}
                      </div>
                    </div>

                    {!!q.topWords?.length && (
                      <div className='mb-4'>
                        <div className='text-muted mb-2'>Palavras mais citadas</div>
                        <div className='bg-light rounded d-flex align-items-center justify-content-center'>
                          <WordCloudCanvas
                            topWords={q.topWords}
                            className='w-100'
                            heightRatio={0.65}
                            minHeight={420}
                            maxWords={120}
                            fontRange={[35, 180]}
                          />
                        </div>
                      </div>
                    )}

                    {(q.bigrams?.length || q.trigrams?.length) ? (
                      <div className='row g-6 mb-4'>
                        {q.bigrams?.length ? (
                          <div className='col-md-6'>
                            <div className='fw-semibold mb-2'>Top bigramas</div>
                            <div className='d-flex flex-wrap gap-2'>
                              {q.bigrams.slice(0, 30).map(b => (
                                <span key={b.phrase} className='badge badge-light'>
                                  {b.phrase} <span className='text-muted'>({b.count})</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {q.trigrams?.length ? (
                          <div className='col-md-6'>
                            <div className='fw-semibold mb-2'>Top trigramas</div>
                            <div className='d-flex flex-wrap gap-2'>
                              {q.trigrams.slice(0, 30).map(t => (
                                <span key={t.phrase} className='badge badge-light'>
                                  {t.phrase} <span className='text-muted'>({t.count})</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {total > 0 ? (
                      <>
                        <div className='table-responsive'>
                          <table className='table'>
                            <thead><tr><th style={{ width: 80 }}>#</th><th>Resposta</th></tr></thead>
                            <tbody>
                              {slice.map((a, idx) => (
                                <tr key={start + idx}><td className='text-muted'>{start + idx + 1}</td><td>{a}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Paginação Metronic */}
                        <div className='d-flex justify-content-between align-items-center mt-4'>
                          <div className='text-muted'>
                            Mostrando <strong>{start + 1}</strong>–<strong>{end}</strong> de <strong>{total}</strong>
                          </div>
                          <nav>
                            <ul className='pagination'>
                              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <a href='#' className='page-link' onClick={e => { e.preventDefault(); if (currentPage > 1) setPage(q.questionId, currentPage - 1) }}>
                                  <i className='previous'></i>Anterior
                                </a>
                              </li>
                              {pageNumbers.map((p, i, arr) => {
                                const prev = arr[i - 1]
                                const showEllipsis = i > 0 && p - (prev ?? 0) > 1
                                return (
                                  <span key={`p-${p}`}>
                                    {showEllipsis && <li className='page-item'><span className='page-link'>…</span></li>}
                                    <li className={`page-item ${p === currentPage ? 'active' : ''}`}>
                                      <a href='#' className='page-link' onClick={e => { e.preventDefault(); setPage(q.questionId, p) }}>{p}</a>
                                    </li>
                                  </span>
                                )
                              })}
                              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <a href='#' className='page-link' onClick={e => { e.preventDefault(); if (currentPage < totalPages) setPage(q.questionId, currentPage + 1) }}>
                                  Próxima<i className='next'></i>
                                </a>
                              </li>
                            </ul>
                          </nav>
                        </div>
                      </>
                    ) : (
                      <div className='text-muted'>Sem respostas.</div>
                    )}
                  </section>
                )
              }

              // fallback
              return (
                <section data-pdf-section className='card card-body mb-6' key={q.questionId}>
                  <div className='fw-semibold'>{cardTitle}</div>
                  <div className='text-muted'>Sem dados.</div>
                </section>
              )
            })}
          </div>
          {/* fim do bloco que vai para o PDF */}
        </Content>
      </div>
    </div>
  )
}

export default SurveyResultsPage