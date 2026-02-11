import React, { useMemo } from 'react'
import ReactApexChart from 'react-apexcharts'
import { getCSSVariableValue } from '../../../../assets/ts/_utils/DomHelpers'

type Props = {
    className?: string
    stats: {
        totalForms: number
        totalSubmissions: number
        onTimeRate: number
        trend: Array<{ date: string; submissions: number }>
    }
}

export const FormsStatsWidget: React.FC<Props> = ({ className, stats }) => {
    const chartOptions: ApexCharts.ApexOptions = useMemo(() => {
        const categories = stats.trend.map(t => t.date)
        return {
            chart: {
                type: 'bar',
                height: 150,
                toolbar: { show: false },
            },
            plotOptions: {
                bar: {
                    borderRadius: 4,
                    columnWidth: '50%',
                }
            },
            dataLabels: { enabled: false },
            xaxis: {
                categories,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: { show: false }
            },
            yaxis: { show: false },
            colors: [getCSSVariableValue('--bs-primary')],
            grid: { show: false }
        }
    }, [stats.trend])

    const series = [
        { name: 'Submissões', data: stats.trend.map(t => t.submissions) }
    ]

    return (
        <div className={`card ${className}`}>
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bold fs-3 mb-1'>Formulários & Workflow</span>
                    <span className='text-muted fw-bold fs-7'>Acompanhamento de demandas e prazos</span>
                </h3>
            </div>
            <div className='card-body py-3'>
                <div className='d-flex flex-wrap flex-stack mb-5'>
                    <div className='d-flex flex-column'>
                        <span className='fs-2hx fw-bold text-dark'>{stats.totalSubmissions}</span>
                        <span className='text-muted fw-semibold fs-7'>Total de Submissões (7d)</span>
                    </div>
                    <div className='d-flex flex-column align-items-end'>
                        <span className='text-primary fs-2hx fw-bold'>{stats.onTimeRate}%</span>
                        <span className='text-muted fw-semibold fs-7'>No Prazo (SLA)</span>
                    </div>
                </div>

                <div className='mb-5'>
                    <ReactApexChart options={chartOptions} series={series} type='bar' height={150} />
                </div>

                <div className='d-flex align-items-center bg-light-warning rounded p-4'>
                    <span className='svg-icon svg-icon-warning me-5'>
                        <i className='bi bi-file-earmark-text fs-1 text-warning'></i>
                    </span>
                    <div className='flex-grow-1'>
                        <div className='fs-6 fw-bold text-gray-800'>{stats.totalForms} Formulários</div>
                        <div className='fw-semibold text-gray-600 fs-7'>Canais de entrada ativos</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
