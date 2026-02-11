import React, { useEffect, useState, useMemo } from 'react'
import { getEngagementFunnel, EngagementFunnelResponse } from '../../../modules/analytics/core/_requests'
import { getCSSVariableValue } from '../../../../assets/ts/_utils/DomHelpers'
import ReactApexChart from 'react-apexcharts'
import { ApexOptions } from 'apexcharts'

type Props = {
    className: string
}

const EngagementFunnelWidget: React.FC<Props> = ({ className }) => {
    const [data, setData] = useState<EngagementFunnelResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [segment, setSegment] = useState<'department' | 'jobTitle' | 'location'>('department')

    const fetchData = () => {
        setLoading(true)
        getEngagementFunnel(undefined, undefined, segment)
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchData()
    }, [segment])

    const radarData = useMemo(() => {
        if (!data || data.segments.length === 0) return null
        const top3 = data.segments.slice(0, 3)
        return {
            categories: ['Ativação', 'Engajamento', 'Retenção (Est.)'],
            series: top3.map((s: any) => ({
                name: s.segment,
                data: [s.activationRate, s.engagementRate, Math.round(s.engagementRate * 0.8)]
            }))
        }
    }, [data])

    const radarOptions: ApexOptions = {
        chart: {
            type: 'radar',
            fontFamily: 'inherit',
            toolbar: { show: false },
        },
        colors: [
            getCSSVariableValue('--bs-primary'),
            getCSSVariableValue('--bs-success'),
            getCSSVariableValue('--bs-warning')
        ],
        stroke: { width: 2 },
        fill: { opacity: 0.2 },
        markers: { size: 4 },
        xaxis: {
            categories: radarData?.categories || [],
            labels: {
                style: { colors: [getCSSVariableValue('--bs-gray-500')], fontSize: '11px' }
            }
        },
        yaxis: { show: false, min: 0, max: 100 },
        legend: {
            show: true,
            position: 'bottom',
            fontSize: '11px'
        }
    }

    if (loading && !data) return <div className={`card ${className} p-5`}>Carregando funil...</div>
    if (!data) return <div className={`card ${className} p-5`}>Erro ao carregar funil</div>

    return (
        <div className={`card ${className}`}>
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bolder fs-3 mb-1'>Funil & Performance Global</span>
                    <span className='text-muted mt-1 fw-bold fs-7'>Análise comparativa de {segment === 'department' ? 'departamentos' : segment === 'jobTitle' ? 'cargos' : 'localizações'}</span>
                </h3>
                <div className='card-toolbar'>
                    <ul className='nav nav-pills nav-pills-custom'>
                        <li className='nav-item'>
                            <button className={`nav-link btn btn-sm btn-icon btn-active-light-primary ${segment === 'department' ? 'active' : ''}`} onClick={() => setSegment('department')} title='Departamento'>
                                <i className='bi bi-diagram-3 fs-3'></i>
                            </button>
                        </li>
                        <li className='nav-item mx-1'>
                            <button className={`nav-link btn btn-sm btn-icon btn-active-light-primary ${segment === 'jobTitle' ? 'active' : ''}`} onClick={() => setSegment('jobTitle')} title='Cargo'>
                                <i className='bi bi-person-badge fs-3'></i>
                            </button>
                        </li>
                        <li className='nav-item'>
                            <button className={`nav-link btn btn-sm btn-icon btn-active-light-primary ${segment === 'location' ? 'active' : ''}`} onClick={() => setSegment('location')} title='Localização'>
                                <i className='bi bi-geo-alt fs-3'></i>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            <div className='card-body pt-2'>
                <div className='row g-5 g-xl-8'>
                    {/* Left: Overall Funnel Status */}
                    <div className='col-xl-5'>
                        <div className='d-flex flex-column h-100 justify-content-between py-2'>
                            <div className='bg-light-primary rounded-3 p-5 mb-4'>
                                <div className='d-flex flex-stack mb-2'>
                                    <span className='text-primary fw-bolder fs-7'>CADASTRO</span>
                                    <span className='text-primary fw-bolder fs-6'>{data.overall.registered}</span>
                                </div>
                                <div className='progress h-6px w-100 bg-white bg-opacity-50'>
                                    <div className='progress-bar bg-primary' style={{ width: '100%' }}></div>
                                </div>
                            </div>
                            <div className='bg-light-success rounded-3 p-5 mb-4'>
                                <div className='d-flex flex-stack mb-2'>
                                    <span className='text-success fw-bolder fs-7'>ATIVAÇÃO</span>
                                    <span className='text-success fw-bolder fs-6'>{data.overall.activated}</span>
                                </div>
                                <div className='progress h-6px w-100 bg-white bg-opacity-50'>
                                    <div className='progress-bar bg-success' style={{ width: `${data.overall.activationRate}%` }}></div>
                                </div>
                                <span className='text-muted fs-9 mt-1 d-block'>{data.overall.activationRate}% dos inscritos ativos</span>
                            </div>
                            <div className='bg-light-info rounded-3 p-5'>
                                <div className='d-flex flex-stack mb-2'>
                                    <span className='text-info fw-bolder fs-7'>ENGAJAMENTO</span>
                                    <span className='text-info fw-bolder fs-6'>{data.overall.engaged}</span>
                                </div>
                                <div className='progress h-6px w-100 bg-white bg-opacity-50'>
                                    <div className='progress-bar bg-info' style={{ width: `${data.overall.engagementRate}%` }}></div>
                                </div>
                                <span className='text-muted fs-9 mt-1 d-block'>{data.overall.engagementRate}% de retenção</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Radar Analysis (Screenshot 4 style) */}
                    <div className='col-xl-7 mt-0'>
                        <div className='d-flex flex-center h-100 min-h-250px'>
                            {radarData ? (
                                <ReactApexChart
                                    options={radarOptions}
                                    series={radarData.series}
                                    type='radar'
                                    height={280}
                                />
                            ) : (
                                <div className='text-muted fs-7'>Sem dados comparativos</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className='separator separator-dashed my-5'></div>

                {/* Bottom: Detailed Table (Compact Screenshot 2 style) */}
                <div className='table-responsive'>
                    <table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-3'>
                        <thead>
                            <tr className='fw-bolder text-muted'>
                                <th className='ps-0 min-w-120px'>Segmento</th>
                                <th className='min-w-100px text-center'>Ativação</th>
                                <th className='min-w-100px text-center'>Engajamento</th>
                                <th className='text-end pe-0'>Health</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.segments.slice(0, 4).map((row: any, idx: number) => (
                                <tr key={idx}>
                                    <td className='ps-0'>
                                        <span className='text-gray-800 fw-bolder fs-7 d-block'>{row.segment}</span>
                                        <span className='text-muted fs-9'>{row.registered} usuários</span>
                                    </td>
                                    <td className='text-center'>
                                        <span className='badge badge-light-success fw-bolder fs-9'>{row.activationRate}%</span>
                                    </td>
                                    <td className='text-center'>
                                        <span className='badge badge-light-info fw-bolder fs-9'>{row.engagementRate}%</span>
                                    </td>
                                    <td className='text-end pe-0'>
                                        <div className={`symbol symbol-10px symbol-circle bg-${row.engagementRate > 50 ? 'success' : 'warning'}`}></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export { EngagementFunnelWidget }
