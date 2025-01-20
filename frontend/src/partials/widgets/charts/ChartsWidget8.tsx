// src/_metronic/partials/widgets/charts/ChartsWidget8.tsx

import React, {useEffect, useRef} from 'react'
import ApexCharts, {ApexOptions} from 'apexcharts'
import {getCSSVariableValue} from '../../../assets/ts/_utils'
import {useThemeMode} from '../../layout/theme-mode/ThemeModeProvider'

type Props = {
  className: string
  data: {
    current: number
    previous: number
    reasons: Array<{
      reason: string
      percentage: number
    }>
  }
}

const ChartsWidget8: React.FC<Props> = ({className, data}) => {
  const chartRef = useRef<HTMLDivElement | null>(null)
  const {mode} = useThemeMode()

  useEffect(() => {
    const chart = refreshChart()

    return () => {
      if (chart) {
        chart.destroy()
      }
    }
  }, [chartRef, mode, data])

  const refreshChart = () => {
    if (!chartRef.current) {
      return
    }

    const chart = new ApexCharts(chartRef.current, chartOptions(data))
    if (chart) {
      chart.render()
    }

    return chart
  }

  return (
    <div className={`card ${className}`}>
      <div className='card-header border-0 pt-5'>
        <h3 className='card-title align-items-start flex-column'>
          <span className='card-label fw-bold fs-3 mb-1'>Taxa de Turnover</span>
          <span className='text-muted fw-semibold fs-7'>Análise de saída de funcionários</span>
        </h3>
      </div>
      <div className='card-body'>
        <div ref={chartRef} id='kt_charts_widget_8_chart' style={{height: '350px'}}></div>
      </div>
    </div>
  )
}

const chartOptions = (data: Props['data']): ApexOptions => {
  const textColor = getCSSVariableValue('--kt-gray-500')
  const borderColor = getCSSVariableValue('--kt-gray-200')

  return {
    series: data.reasons.map(reason => reason.percentage),
    chart: {
      fontFamily: 'inherit',
      type: 'pie',
      height: 350,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '50%',
          labels: {
            value: {
              fontSize: '10px'
            }
          }
        }
      }
    },
    colors: ['#3E97FF', '#F1416C', '#50CD89', '#FFC700', '#7239EA'],
    stroke: {
      width: 0
    },
    labels: data.reasons.map(reason => reason.reason),
    legend: {
      show: false
    },
    fill: {
      type: 'gradient'
    }
  }
}

export {ChartsWidget8}