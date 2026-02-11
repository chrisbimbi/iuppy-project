
import React, { useMemo, useState } from 'react'
import ApexCharts from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import { KTSVG } from '../../../../helpers'

type Props = {
    className: string
    heatmapData?: Array<{ day: number; hour: number; count: number }>
    heatmapViews?: Array<{ day: number; hour: number; count: number }>
    heatmapEngagement?: Array<{ day: number; hour: number; count: number }>
    channelsData: Array<{ channelName: string; newsCount: number; uniqueOpens: number; avgOpensPerNews: number }>
}

const ContentOverviewWidget: React.FC<Props> = ({ className, heatmapData, heatmapViews, heatmapEngagement, channelsData }) => {

    const [mode, setMode] = useState<'engagement' | 'views'>('engagement')

    const activeData = useMemo(() => {
        if (mode === 'views' && heatmapViews && heatmapViews.length > 0) return heatmapViews;
        if (mode === 'engagement' && heatmapEngagement && heatmapEngagement.length > 0) return heatmapEngagement;
        // Fallback to generic heatmapData if specific arrays are missing
        return heatmapData || [];
    }, [mode, heatmapData, heatmapViews, heatmapEngagement])

    // --- Heatmap Chart Options ---
    const heatmapOptions: ApexCharts.ApexOptions = useMemo(() => {
        // Transform data: 7 series (Days), each with 24 data points (Hours)
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
        const series = days.map((d, dayIndex) => {
            return {
                name: d,
                data: Array.from({ length: 24 }, (_, hour) => {
                    const point = activeData?.find(h => h.day === dayIndex && h.hour === hour)
                    return { x: hour.toString(), y: point ? point.count : 0 }
                })
            }
        }).reverse() // Reverse to show Sunday at top or bottom? Usually charts show Series 1 at top.

        const colorScale = mode === 'views'
            ? ['#009EF7'] // Blue for Views
            : ['#F1416C']; // Red/Pink for Engagement

        return {
            chart: {
                type: 'heatmap',
                height: 350,
                toolbar: { show: false }
            },
            dataLabels: { enabled: false },
            colors: colorScale,
            title: {
                text: mode === 'views' ? 'Mapa de Calor (Visualizações)' : 'Mapa de Calor (Engajamento)',
                align: 'left',
                style: { fontSize: '13px', color: '#888' }
            },
            xaxis: {
                type: 'category',
                categories: Array.from({ length: 24 }, (_, i) => i.toString() + 'h')
            }
        }
    }, [activeData, mode])

    // Series for heatmap
    const heatmapSeries = useMemo(() => {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
        return days.map((d, dayIndex) => {
            return {
                name: d,
                data: Array.from({ length: 24 }, (_, hour) => {
                    const point = activeData?.find(h => h.day === dayIndex && h.hour === hour)
                    return { x: hour.toString(), y: point ? point.count : 0 }
                })
            }
        }).reverse()
    }, [activeData])

    return (
        <div className={`card ${className}`}>
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bold fs-3 mb-1'>Visão Geral de Conteúdo</span>
                    <span className='text-muted mt-1 fw-semibold fs-7'>Canais, Espaços e Engajamento</span>
                </h3>
                <div className='card-toolbar'>
                    <ul className='nav nav-pills nav-pills-sm nav-light'>
                        <li className='nav-item'>
                            <a
                                className={`nav-link btn btn-active-light btn-color-muted py-2 px-4 fw-bold me-2 ${mode === 'views' ? 'active' : ''}`}
                                href='#'
                                onClick={(e) => { e.preventDefault(); setMode('views'); }}
                            >
                                Views
                            </a>
                        </li>
                        <li className='nav-item'>
                            <a
                                className={`nav-link btn btn-active-light btn-color-muted py-2 px-4 fw-bold ${mode === 'engagement' ? 'active' : ''}`}
                                href='#'
                                onClick={(e) => { e.preventDefault(); setMode('engagement'); }}
                            >
                                Engajamento
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div className='card-body py-3'>
                <div className='row'>
                    {/* Heatmap Section */}
                    <div className='col-lg-8'>
                        <ReactApexChart options={heatmapOptions} series={heatmapSeries} type="heatmap" height={350} />
                    </div>

                    {/* Channels List Section */}
                    <div className='col-lg-4'>
                        <h4 className='mb-4'>Top Canais</h4>
                        <div className='table-responsive'>
                            <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                                <thead>
                                    <tr className='fw-bold text-muted'>
                                        <th className='min-w-100px'>Canal</th>
                                        <th className='min-w-50px text-end'>Posts</th>
                                        <th className='min-w-50px text-end'>Interações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {channelsData?.map((channel, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <div className='d-flex align-items-center'>
                                                    <div className='d-flex justify-content-start flex-column'>
                                                        <span className='text-dark fw-bold text-hover-primary fs-6'>{channel.channelName}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='text-end'>
                                                <span className='text-muted fw-bold d-block fs-7'>{channel.newsCount} posts</span>
                                            </td>
                                            <td className='text-end'>
                                                <span className='badge badge-light-primary fw-bold'>{channel.uniqueOpens} leituras</span>
                                                <span className='text-muted d-block fs-8 mt-1'>~{channel.avgOpensPerNews}/post</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!channelsData || channelsData.length === 0) && (
                                        <tr><td colSpan={3} className='text-center text-muted'>Sem dados</td></tr>
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

export { ContentOverviewWidget }
