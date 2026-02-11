import React, { useEffect, useState } from 'react'
import ReactApexChart from 'react-apexcharts'
import { getCSSVariableValue } from '../../../../assets/ts/_utils/DomHelpers'
import { getSearchAnalytics, SearchAnalyticsResponse } from '../../../modules/analytics/core/_requests'

type Props = {
    className: string
}

const SearchStatsWidget: React.FC<Props> = ({ className }) => {
    const [stats, setStats] = useState<SearchAnalyticsResponse | null>(null)

    useEffect(() => {
        getSearchAnalytics().then(res => setStats(res.data)).catch(console.error)
    }, [])

    if (!stats) return <div className={`card ${className} p-5`}>Carregando Analytics de Busca...</div>

    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            fontFamily: 'inherit',
            type: 'bar',
            toolbar: { show: false },
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 4,
                barHeight: '40%',
                distributed: true
            }
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: stats.topQueries.map((q: any) => q.q),
            labels: {
                style: { colors: '#A1A5B7', fontSize: '12px' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                style: { colors: '#181C32', fontSize: '13px', fontWeight: 600 },
                maxWidth: 200
            }
        },
        legend: { show: false },
        colors: [
            getCSSVariableValue('--bs-primary'),
            getCSSVariableValue('--bs-success'),
            getCSSVariableValue('--bs-info'),
            getCSSVariableValue('--bs-warning'),
            getCSSVariableValue('--bs-danger')
        ],
        grid: {
            borderColor: getCSSVariableValue('--bs-gray-200'),
            strokeDashArray: 4,
            yaxis: { lines: { show: false } },
            padding: { top: 0, right: 0, bottom: 0, left: 10 }
        },
    }

    const series = [{
        name: 'Buscas',
        data: stats.topQueries.map((q: any) => q.count)
    }]

    return (
        <div className={`card ${className}`}>
            {/* Header */}
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bolder fs-3 mb-1'>O que estão buscando?</span>
                    <span className='text-muted mt-1 fw-bold fs-7'>Análise de intenção e gaps de conteúdo</span>
                </h3>
                <div className='card-toolbar'>
                    <div className='d-flex align-items-center bg-light-primary rounded p-2 me-3'>
                        <span className='text-primary fw-bolder fs-6 px-2'>{stats.totalSearches}</span>
                        <span className='text-muted fs-8 fw-bold'>Buscas</span>
                    </div>
                </div>
            </div>

            <div className='card-body pt-2 pb-0'>
                <div className='row g-5 g-xl-10'>
                    {/* Top Queries Row */}
                    <div className='col-md-7 mb-5'>
                        <div className='d-flex align-items-center mb-5'>
                            <div className='symbol symbol-40px me-3'>
                                <div className='symbol-label bg-light-primary'>
                                    <i className='bi bi-search text-primary fs-2'></i>
                                </div>
                            </div>
                            <div className='d-flex flex-column'>
                                <span className='text-gray-800 fw-bolder fs-5'>Termos Populares</span>
                                <span className='text-muted fw-bold fs-7'>Volume de busca por termo</span>
                            </div>
                        </div>

                        <div className='min-h-auto'>
                            {stats.topQueries.length > 0 ? (
                                <ReactApexChart options={chartOptions} series={series} type='bar' height={250} />
                            ) : (
                                <div className='d-flex flex-column align-items-center justify-content-center h-200px'>
                                    <span className='text-gray-400'>Nenhuma busca registrada ainda.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content Gaps Row */}
                    <div className='col-md-5 mb-5'>
                        <div className='d-flex align-items-center mb-5'>
                            <div className='symbol symbol-40px me-3'>
                                <div className='symbol-label bg-light-danger'>
                                    <i className='bi bi-exclamation-triangle text-danger fs-2'></i>
                                </div>
                            </div>
                            <div className='d-flex flex-column'>
                                <span className='text-gray-800 fw-bolder fs-5 text-danger'>Gaps Críticos</span>
                                <span className='text-muted fw-bold fs-7'>Buscas sem resultado</span>
                            </div>
                        </div>

                        <div className='table-responsive'>
                            <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-3'>
                                <thead>
                                    <tr className='fw-bolder text-muted'>
                                        <th className='ps-0'>Termo</th>
                                        <th className='text-end'>Incidência</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.zeroResultQueries.length > 0 ? (
                                        stats.zeroResultQueries.map((item, i) => (
                                            <tr key={i}>
                                                <td className='ps-0'>
                                                    <div className='d-flex align-items-center'>
                                                        <div className='symbol symbol-30px me-3'>
                                                            <div className='symbol-label bg-light'>
                                                                <span className='text-gray-600 fs-9 fw-bold'>{i + 1}</span>
                                                            </div>
                                                        </div>
                                                        <span className='text-gray-800 fw-bold fs-6'>{item.q}</span>
                                                    </div>
                                                </td>
                                                <td className='text-end pe-0'>
                                                    <span className='badge badge-light-danger fw-bolder px-4 py-3'>
                                                        {item.count} falhas
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={2} className='text-center text-muted py-10'>
                                                <div className='d-flex flex-column align-items-center'>
                                                    <i className='bi bi-check-circle text-success fs-3x mb-2'></i>
                                                    <span className='fw-bold'>Nenhum gap encontrado! 🎉</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export { SearchStatsWidget }
