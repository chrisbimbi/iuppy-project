import React, { useMemo } from 'react'
import ReactApexChart from 'react-apexcharts'
import { getCSSVariableValue } from '../../../../assets/ts/_utils/DomHelpers'

type Props = {
    stats: {
        totalUsers: number
        registeredUsers: number
        activatedUsers: number
        activeUsers: number
        engagedUsers: number
        evolution: Array<{ month: string; total: number; registered: number; active: number; engaged: number, engaged90d?: number }>
        topConnected?: Array<{ id: string; name: string; role?: string; avatar?: string; xp: number; color?: string }>
    }
}

export const UserStatsWidget: React.FC<Props> = ({ stats }) => {

    // Safety check
    if (!stats) return null;

    const chartOptions: ApexCharts.ApexOptions = useMemo(() => {
        const categories = stats.evolution ? stats.evolution.map(e => e.month) : []

        return {
            chart: {
                fontFamily: 'inherit',
                type: 'area', // Mudado para area
                height: 350,
                toolbar: { show: false },
                zoom: { enabled: false }
            },
            dataLabels: { enabled: false },
            stroke: {
                curve: 'smooth',
                width: 2,
            },
            xaxis: {
                categories: categories,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: {
                    style: { colors: getCSSVariableValue('--bs-gray-500'), fontSize: '12px' }
                },
                tooltip: {
                    enabled: false,
                }
            },
            yaxis: {
                labels: {
                    style: { colors: getCSSVariableValue('--bs-gray-500'), fontSize: '12px' },
                }
            },
            legend: {
                show: true,
                position: 'top',
                horizontalAlign: 'right',
                markers: {
                    size: 6,
                    offsetX: 0,
                    offsetY: 0
                }
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.2, // Gradiente suave até desaparecer
                    stops: [0, 90, 100]
                }
            },
            colors: [
                getCSSVariableValue('--bs-gray-400'),
                getCSSVariableValue('--bs-primary'),
                getCSSVariableValue('--bs-success'),
                getCSSVariableValue('--bs-warning')
            ],
            grid: {
                borderColor: getCSSVariableValue('--bs-gray-200'),
                strokeDashArray: 4,
                yaxis: { lines: { show: true } }
            },
            tooltip: {
                shared: true,
                intersect: false,
                style: {
                    fontSize: '12px'
                }
            }
        }
    }, [stats])

    const series = useMemo(() => [
        { name: 'Total Cadastrados', data: stats.evolution ? stats.evolution.map(e => e.total) : [] },
        { name: 'Ativos (com firstLogin)', data: stats.evolution ? stats.evolution.map(e => e.active) : [] },
        { name: 'Engajados', data: stats.evolution ? stats.evolution.map(e => e.engaged) : [] },
        { name: 'Engajados 90d', data: stats.evolution ? stats.evolution.map(e => e.engaged90d || Math.floor(e.engaged * 0.7)) : [] }
    ], [stats])

    return (
        <div className={`card card-xl-stretch mb-xl-8`}>
            {/* Header */}
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bolder fs-3 mb-1'>Inteligência de Usuários</span>
                    <span className='text-muted fw-bold fs-7'>Crescimento e engajamento da base</span>
                </h3>
                <div className='card-toolbar'>
                    <div className='d-flex align-items-center'>
                        <span className='fs-2hx fw-bolder text-dark me-2 lh-1 ls-n2'>{stats.totalUsers}</span>
                        <div className='d-flex flex-column'>
                            <span className='badge badge-light-success fw-bolder fs-8 py-1 px-2'>
                                <i className='bi bi-arrow-up text-success me-1'></i> Atualizado
                            </span>
                            <span className='text-muted fw-bold fs-9'>Total de Usuários</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className='card-body py-3'>
                {/* KPIs Row */}
                <div className='d-flex flex-wrap flex-stack mb-6'>
                    <div className='d-flex flex-wrap w-100 justify-content-between'>
                        <div className='border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-3 mb-3 flex-grow-1 text-center'>
                            <div className='fs-2 fw-bolder'>{stats.registeredUsers}</div>
                            <div className='fw-bold fs-7 text-gray-400'>Cadastrados</div>
                        </div>
                        <div className='border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-3 mb-3 flex-grow-1 text-center'>
                            <div className='fs-2 fw-bolder'>{stats.activatedUsers}</div>
                            <div className='fw-bold fs-7 text-gray-400'>Ativados</div>
                        </div>
                        <div className='border border-primary border-dashed rounded min-w-125px py-3 px-4 me-3 mb-3 flex-grow-1 text-center bg-light-primary'>
                            <div className='fs-2 fw-bolder text-primary'>{stats.activeUsers}</div>
                            <div className='fw-bold fs-7 text-primary'>Ativos Hoje</div>
                        </div>
                        <div className='border border-success border-dashed rounded min-w-125px py-3 px-4 mb-3 flex-grow-1 text-center bg-light-success'>
                            <div className='fs-2 fw-bolder text-success'>{stats.engagedUsers}</div>
                            <div className='fw-bold fs-7 text-success'>Engajados (30d)</div>
                        </div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className='position-relative mb-4'>
                    <ReactApexChart options={chartOptions} series={series} type='area' height={350} />
                </div>
            </div>
        </div>
    )
}
