import React, { useEffect, useState } from 'react'
import ReactApexChart from 'react-apexcharts'
import { ApexOptions } from 'apexcharts'
import { getReadingBehavior, ReadingBehaviorResponse } from '../../../modules/analytics/core/_requests'
import { getCSSVariableValue } from '../../../../assets/ts/_utils/DomHelpers'

type Props = {
    className: string
}

const ReadingBehaviorWidget: React.FC<Props> = ({ className }) => {
    const [data, setData] = useState<ReadingBehaviorResponse | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getReadingBehavior()
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className={`card ${className} p-5`}>Carregando dados de leitura...</div>
    if (!data) return <div className={`card ${className} p-5`}>Erro ao carregar dados</div>

    const totalTracked = data.buckets.glanced + data.buckets.skimmed + data.buckets.read
    const readRate = totalTracked > 0 ? Math.round((data.buckets.read / totalTracked) * 100) : 0
    const avgSeconds = data.avgDurationMs ? Math.round(data.avgDurationMs / 1000) : 0

    // Donut Chart Configuration
    const chartOptions: ApexOptions = {
        chart: {
            type: 'donut',
            fontFamily: 'inherit',
        },
        labels: ['Olharam (< 3s)', 'Leram Rápido', 'Leitura Profunda'],
        colors: [
            getCSSVariableValue('--bs-danger'),
            getCSSVariableValue('--bs-warning'),
            getCSSVariableValue('--bs-success')
        ],
        stroke: {
            show: false,
        },
        legend: {
            show: false
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '75%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#A1A5B7',
                            offsetY: -10
                        },
                        value: {
                            show: true,
                            fontSize: '22px',
                            fontWeight: 700,
                            color: '#181C32',
                            offsetY: 10,
                            formatter: (val) => `${val}`,
                        },
                        total: {
                            show: true,
                            label: 'Total',
                            fontSize: '12px',
                            color: '#A1A5B7',
                            formatter: () => `${totalTracked}`,
                        },
                    },
                },
            },
        },
        dataLabels: {
            enabled: false,
        },
        states: {
            hover: {
                filter: { type: 'none' }
            },
            active: {
                allowMultipleDataPointsSelection: false,
                filter: { type: 'none' }
            }
        },
        tooltip: {
            style: {
                fontSize: '12px'
            },
            y: {
                formatter: (val) => `${val} aberturas`,
            },
        },
    }

    const series = [data.buckets.glanced, data.buckets.skimmed, data.buckets.read]

    return (
        <div className={`card ${className}`}>
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bolder fs-3 mb-1'>Qualidade da Leitura</span>
                    <span className='text-muted mt-1 fw-bold fs-7'>Análise de retenção e profundidade</span>
                </h3>
                <div className='card-toolbar'>
                    <div className='badge badge-light-success fs-7 fw-bolder px-4 py-3'>
                        {readRate}% Engajados
                    </div>
                </div>
            </div>

            <div className='card-body pt-2'>
                {totalTracked === 0 ? (
                    <div className='d-flex flex-column align-items-center justify-content-center h-250px'>
                        <i className='bi bi-clock-history fs-3x text-gray-200 mb-3'></i>
                        <span className='text-gray-400 fs-6 fw-bold'>Aguardando dados de navegação...</span>
                    </div>
                ) : (
                    <div className='d-flex flex-column'>
                        {/* Upper Section: Chart and Main KPI */}
                        <div className='d-flex flex-stack mb-5'>
                            <div className='d-flex flex-column flex-grow-1 border border-gray-300 border-dashed rounded p-5 me-5 text-center'>
                                <span className='text-gray-800 fw-bolder fs-7 mb-2'>Taxa de Finalização</span>
                                <div className='d-flex flex-center position-relative h-100px'>
                                    <ReactApexChart
                                        options={{
                                            chart: { type: 'radialBar', sparkline: { enabled: true } },
                                            plotOptions: {
                                                radialBar: {
                                                    hollow: { size: '60%' },
                                                    dataLabels: {
                                                        name: { show: false },
                                                        value: {
                                                            offsetY: 5,
                                                            fontSize: '20px',
                                                            fontWeight: '700',
                                                            formatter: (val) => `${val}%`
                                                        }
                                                    }
                                                }
                                            },
                                            colors: [getCSSVariableValue('--bs-success')]
                                        }}
                                        series={[Math.round((data.buckets.read / totalTracked) * 100) || 0]}
                                        type='radialBar'
                                        height={140}
                                    />
                                </div>
                                <span className='text-muted fw-bold fs-8 mt-2'>Leitura Profunda (&gt;10s)</span>
                            </div>

                            <div className='min-h-auto ps-2'>
                                <ReactApexChart
                                    options={chartOptions}
                                    series={series}
                                    type='donut'
                                    width={180}
                                    height={180}
                                />
                            </div>
                        </div>

                        {/* Lower Section: Detailed Buckets */}
                        <div className='separator separator-dashed my-5'></div>

                        <div className='d-flex flex-column'>
                            {/* Detailed Rows */}
                            <div className='d-flex align-items-center mb-5'>
                                <div className='bullet bullet-vertical h-40px bg-success me-5'></div>
                                <div className='d-flex flex-column flex-grow-1'>
                                    <span className='text-gray-800 fw-bolder fs-6'>Leitura Profunda</span>
                                    <span className='text-muted fw-bold fs-7'>Usuários que leram por mais de 10s</span>
                                </div>
                                <div className='d-flex flex-column align-items-end'>
                                    <span className='text-gray-800 fw-bolder fs-6'>{data.buckets.read}</span>
                                    <span className='badge badge-light-success fs-9 fw-bolder'>{Math.round((data.buckets.read / totalTracked) * 100)}%</span>
                                </div>
                            </div>

                            <div className='d-flex align-items-center mb-5'>
                                <div className='bullet bullet-vertical h-40px bg-warning me-5'></div>
                                <div className='d-flex flex-column flex-grow-1'>
                                    <span className='text-gray-800 fw-bolder fs-6'>Leitura Rápida</span>
                                    <span className='text-muted fw-bold fs-7'>Usuários que ficaram entre 3s e 10s</span>
                                </div>
                                <div className='d-flex flex-column align-items-end'>
                                    <span className='text-gray-800 fw-bolder fs-6'>{data.buckets.skimmed}</span>
                                    <span className='badge badge-light-warning fs-9 fw-bolder'>{Math.round((data.buckets.skimmed / totalTracked) * 100)}%</span>
                                </div>
                            </div>

                            <div className='d-flex align-items-center'>
                                <div className='bullet bullet-vertical h-40px bg-danger me-5'></div>
                                <div className='d-flex flex-column flex-grow-1'>
                                    <span className='text-gray-800 fw-bolder fs-6'>Apenas Olharam</span>
                                    <span className='text-muted fw-bold fs-7'>Usuários que saíram em menos de 3s</span>
                                </div>
                                <div className='d-flex flex-column align-items-end'>
                                    <span className='text-gray-800 fw-bolder fs-6'>{data.buckets.glanced}</span>
                                    <span className='badge badge-light-danger fs-9 fw-bolder'>{Math.round((data.buckets.glanced / totalTracked) * 100)}%</span>
                                </div>
                            </div>
                        </div>

                        {data.noDuration > 0 && (
                            <div className='mt-8 p-4 bg-light-dark rounded border border-dashed border-gray-400'>
                                <span className='text-gray-600 fs-9 fw-bold'>
                                    💡 Nota: {data.noDuration} interações legadas não possuem timestamp.
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export { ReadingBehaviorWidget }
