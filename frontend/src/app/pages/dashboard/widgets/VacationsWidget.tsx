import React, { useMemo } from 'react'
import ReactApexChart from 'react-apexcharts'
import { KTSVG } from '../../../../helpers'

type Props = {
    className: string
    stats: {
        totalRequests: number
        pendingRequests: number
        approvedRequests: number
        awayNow: number
        riskDistribution: { ok: number, warning: number, critical: number }
        financialLiability: number
    }
}

const VacationsWidget: React.FC<Props> = ({ className, stats }) => {
    const chartOptions: ApexCharts.ApexOptions = useMemo(() => {
        return {
            chart: { type: 'donut' },
            labels: ['Seguro', 'Atenção (<90d)', 'Crítico (Vencido)'],
            colors: ['#50CD89', '#FFC700', '#F1416C'],
            dataLabels: { enabled: false },
            legend: { position: 'bottom' },
            plotOptions: {
                pie: {
                    donut: {
                        size: '65%',
                        labels: {
                            show: true,
                            name: { show: true },
                            value: { show: true, fontSize: '20px', fontWeight: 'bold' }
                        }
                    }
                }
            }
        }
    }, [])

    const chartSeries = useMemo(() => {
        return [
            stats?.riskDistribution?.ok || 0,
            stats?.riskDistribution?.warning || 0,
            stats?.riskDistribution?.critical || 0
        ]
    }, [stats])

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
    }

    return (
        <div className={`card ${className}`}>
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bold fs-3 mb-1'>Gestão de Férias</span>
                    <span className='text-muted mt-1 fw-semibold fs-7'>Risco e Passivo Trabalhista</span>
                </h3>
            </div>
            <div className='card-body py-3'>
                <div className='row align-items-center'>
                    <div className='col-md-6'>
                        <ReactApexChart options={chartOptions} series={chartSeries} type="donut" height={200} />
                    </div>
                    <div className='col-md-6'>
                        <div className='d-flex flex-column mb-5'>
                            <span className='text-gray-400 fw-bold fs-7'>Passivo Estimado</span>
                            <span className='fs-2x fw-bold text-dark'>{formatCurrency(stats?.financialLiability || 0)}</span>
                            <span className='text-muted fs-8'>Baseado em salário médio de mercado</span>
                        </div>

                        <div className='d-flex flex-column'>
                            <span className='text-gray-400 fw-bold fs-7'>Ausentes Hoje</span>
                            <div className='d-flex align-items-center'>
                                <span className='fs-2 fw-bold text-primary me-2'>{stats?.awayNow || 0}</span>
                                <span className='badge badge-light-primary'>Colaboradores</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export { VacationsWidget }
