import React, { useEffect, useRef } from 'react'
import ApexCharts, { ApexOptions } from 'apexcharts'
import { useThemeMode } from '../../../partials/layout/theme-mode/ThemeModeProvider'

type Props = {
    className?: string
    options: ApexOptions
    height?: string | number
}

const BaseChart: React.FC<Props> = ({ className, options, height = '350px' }) => {
    const chartRef = useRef<HTMLDivElement | null>(null)
    const { mode } = useThemeMode()

    useEffect(() => {
        const chart = refreshChart()

        return () => {
            if (chart) {
                chart.destroy()
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chartRef, mode, options])

    const refreshChart = () => {
        if (!chartRef.current) {
            return
        }

        const chart = new ApexCharts(chartRef.current, options)
        if (chart) {
            chart.render()
        }

        return chart
    }

    return (
        <div ref={chartRef} className={className} style={{ height }}></div>
    )
}

export { BaseChart }
