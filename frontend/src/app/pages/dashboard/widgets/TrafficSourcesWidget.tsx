import React, { useEffect, useState } from 'react'
import ReactApexChart from 'react-apexcharts'
import { ApexOptions } from 'apexcharts'
import { getTrafficSources, TrafficSourcesResponse } from '../../../modules/analytics/core/_requests'
import { getCSSVariableValue } from '../../../../assets/ts/_utils/DomHelpers'

type Props = {
    className: string
}

const TrafficSourcesWidget: React.FC<Props> = ({ className }) => {
    const [data, setData] = useState<TrafficSourcesResponse | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getTrafficSources()
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className={`card ${className} p-5`}>Carregando dados de tráfego...</div>
    if (!data) return <div className={`card ${className} p-5`}>Erro ao carregar dados</div>

    // Source labels with friendly names and icons
    const sourceMeta: Record<string, { label: string, icon: string, color: string }> = {
        'push': { label: 'Push Notification', icon: 'bi-app-indicator', color: 'primary' },
        'app': { label: 'App Navigation', icon: 'bi-phone', color: 'success' },
        'web': { label: 'Portal Web', icon: 'bi-globe', color: 'info' },
        'email': { label: 'Email Marketing', icon: 'bi-envelope', color: 'warning' },
        'direct': { label: 'Acesso Direto', icon: 'bi-link-45deg', color: 'danger' },
        'unknown': { label: 'Desconhecido', icon: 'bi-question-circle', color: 'secondary' },
    }

    const getMeta = (source: string) => sourceMeta[source] || { label: source, icon: 'bi-link', color: 'primary' }

    // Pie Chart Configuration
    const chartOptions: ApexOptions = {
        chart: {
            type: 'donut',
            fontFamily: 'inherit',
        },
        labels: data.sources.map(s => getMeta(s.source).label),
        colors: data.sources.map(s => getCSSVariableValue(`--bs-${getMeta(s.source).color}`)),
        stroke: {
            show: false
        },
        legend: {
            show: false
        },
        dataLabels: {
            enabled: false
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        name: { show: false },
                        value: {
                            show: true,
                            fontSize: '20px',
                            fontWeight: 700,
                            color: '#181C32',
                            formatter: (val) => `${val}`
                        },
                        total: {
                            show: true,
                            label: 'Total',
                            formatter: () => `${data.totalOpens}`
                        }
                    }
                }
            }
        },
        tooltip: {
            y: {
                formatter: (val) => `${val} aberturas`,
            },
        },
    }

    const series = data.sources.map(s => s.count)

    return (
        <div className={`card ${className}`}>
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bolder fs-3 mb-1'>Origem do Tráfego</span>
                    <span className='text-muted mt-1 fw-bold fs-7'>Canais de aquisição e campanhas</span>
                </h3>
            </div>

            <div className='card-body pt-2'>
                {data.sources.length === 0 ? (
                    <div className='d-flex flex-column align-items-center justify-content-center h-250px'>
                        <i className='bi bi-globe2 fs-3x text-gray-200 mb-3'></i>
                        <span className='text-gray-400 fs-6 fw-bold'>Aguardando dados de acesso...</span>
                    </div>
                ) : (
                    <div className='d-flex flex-column'>
                        {/* Upper: Distribution */}
                        <div className='d-flex flex-stack mb-5'>
                            <div className='min-h-auto container-chart'>
                                <ReactApexChart
                                    options={chartOptions}
                                    series={series}
                                    type='donut'
                                    width={200}
                                    height={200}
                                />
                            </div>
                            <div className='d-flex flex-column flex-grow-1 ps-8'>
                                {data.sources.slice(0, 4).map((source, i) => {
                                    const meta = getMeta(source.source)
                                    return (
                                        <div key={i} className='d-flex align-items-center mb-3'>
                                            <div className={`symbol symbol-10px symbol-circle me-3 bg-${meta.color}`}></div>
                                            <div className='d-flex flex-column flex-grow-1'>
                                                <span className='text-gray-800 fw-bold fs-7'>{meta.label}</span>
                                            </div>
                                            <span className='text-gray-600 fw-bolder fs-7'>{source.percentage}%</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className='separator separator-dashed my-5'></div>

                        {/* Middle: UTM Campaigns */}
                        <div className='mb-5'>
                            <div className='d-flex align-items-center mb-5'>
                                <span className='text-gray-800 fw-bolder fs-5 flex-grow-1'>Performance de Campanhas</span>
                                <span className='badge badge-light-primary fw-bolder'>TOP CAMPANHAS</span>
                            </div>

                            <div className='table-responsive'>
                                <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-3'>
                                    <thead>
                                        <tr className='fw-bolder text-muted'>
                                            <th className='ps-0'>Campanha</th>
                                            <th className='text-center'>Meio</th>
                                            <th className='text-end pe-0'>Engajamento</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.campaigns.length > 0 ? (
                                            data.campaigns.slice(0, 5).map((campaign, idx) => (
                                                <tr key={idx}>
                                                    <td className='ps-0'>
                                                        <span className='text-gray-800 fw-bold fs-7 d-block'>{campaign.campaign}</span>
                                                        <span className='text-muted fs-9'>{campaign.source}</span>
                                                    </td>
                                                    <td className='text-center'>
                                                        <span className='badge badge-light fs-9'>{campaign.medium || 'N/A'}</span>
                                                    </td>
                                                    <td className='text-end pe-0'>
                                                        <div className='d-flex flex-column align-items-end'>
                                                            <span className='text-gray-800 fw-bolder fs-7'>{campaign.count}</span>
                                                            <span className='text-muted fs-9'>{campaign.uniqueUsers} users</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className='text-center text-muted py-5 fs-7'>
                                                    Nenhuma campanha UTM identificada.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export { TrafficSourcesWidget }
