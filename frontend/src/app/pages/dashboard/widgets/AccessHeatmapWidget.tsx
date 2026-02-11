
import React, { useMemo } from 'react'
import ReactApexChart from 'react-apexcharts'

type Props = {
    className: string
    heatmap?: Array<{ dow: number; hour: number; count: number }>
}

export const AccessHeatmapWidget: React.FC<Props> = ({ className, heatmap }) => {

    const chartOptions: ApexCharts.ApexOptions = useMemo(() => {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

        return {
            chart: {
                type: 'heatmap',
                height: 350,
                toolbar: { show: false }
            },
            dataLabels: { enabled: false },
            colors: ['#7239ea'], // Purple for Access/Users
            title: {
                text: 'Mapa de Calor de Acessos',
                align: 'left',
                style: { fontSize: '13px', color: '#888' }
            },
            xaxis: {
                type: 'category',
                categories: Array.from({ length: 24 }, (_, i) => i.toString() + 'h')
            },
            plotOptions: {
                heatmap: {
                    shadeIntensity: 0.5,
                    radius: 0,
                    useFillColorAsStroke: true,
                    colorScale: {
                        ranges: [{
                            from: 0,
                            to: 0,
                            name: 'Sem acesso',
                            color: '#F1F1F4' // gray-100
                        }]
                    }
                }
            }
        }
    }, [])

    const series = useMemo(() => {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
        return days.map((d, dayIndex) => {
            return {
                name: d,
                data: Array.from({ length: 24 }, (_, hour) => {
                    // Backend returns 'dow' (Day of Week) 0-6
                    const point = heatmap?.find(h => Number(h.dow) === dayIndex && Number(h.hour) === hour)
                    return { x: hour.toString(), y: point ? Number(point.count) : 0 }
                })
            }
        }).reverse()
    }, [heatmap])

    return (
        <div className={`card ${className}`}>
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bolder fs-3 mb-1'>Padrão de Acesso</span>
                    <span className='text-muted mt-1 fw-bold fs-7'>Horários de maior atividade na plataforma</span>
                </h3>
            </div>
            <div className='card-body py-3'>
                <ReactApexChart options={chartOptions} series={series} type="heatmap" height={350} />
            </div>
        </div>
    )
}
