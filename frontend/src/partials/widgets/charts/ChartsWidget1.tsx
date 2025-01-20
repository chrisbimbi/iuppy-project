// src/_metronic/partials/widgets/charts/ChartsWidget1.tsx

import React, { useEffect, useRef } from 'react'
import ApexCharts, { ApexOptions } from 'apexcharts'
import { getCSSVariableValue } from '../../../assets/ts/_utils'
import { useThemeMode } from '../../layout/theme-mode/ThemeModeProvider'

type Props = {
  className: string
  data: {
    hiring: number[]
    firing: number[]
    months: string[]
  }
}

const ChartsWidget1: React.FC<Props> = ({ className, data }) => {
  const chartRef = useRef<HTMLDivElement | null>(null)
  const { mode } = useThemeMode()

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
          <span className='card-label fw-bold fs-3 mb-1'>Contratações vs Demissões</span>
          <span className='text-muted fw-semibold fs-7'>Análise dos últimos 6 meses</span>
        </h3>
      </div>
      <div className='card-body'>
        <div ref={chartRef} id='kt_charts_widget_1_chart' style={{ height: '350px' }}></div>
      </div>
    </div>
  )
}

const chartOptions = (data: Props['data']): ApexOptions => {
  const textColor = '#3699FF'
  const borderColor = '#3699FF'
  const baseColor = '#FFCC99'
  const secondaryColor = '#3699FF'


  return {
    series: [
      {
        name: 'Contratações',
        data: data.hiring
      },
      {
        name: 'Demissões',
        data: data.firing
      },
    ],
    chart: {
      fontFamily: 'inherit',
      type: 'area',
      height: 350,
      toolbar: {
        show: false
      }
    },
    plotOptions: {},
    legend: {
      show: false
    },
    dataLabels: {
      enabled: false
    },
    fill: {
      type: 'solid',
      opacity: 1
    },
    stroke: {
      curve: 'smooth',
      show: true,
      width: 3,
      colors: [baseColor, secondaryColor]
    },
    xaxis: {
      categories: data.months,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false
      },
      labels: {
        style: {
          colors: textColor,
          fontSize: '12px'
        }
      },
      crosshairs: {
        position: 'front',
        stroke: {
          color: baseColor,
          width: 1,
          dashArray: 3
        }
      },
      tooltip: {
        enabled: true,
        formatter: undefined,
        offsetY: 0,
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: textColor,
          fontSize: '12px'
        }
      }
    },
    states: {

      hover: {
        filter: {
          type: 'none',

        }
      },
      active: {
        allowMultipleDataPointsSelection: false,
        filter: {
          type: 'none',

        }
      }
    },
    tooltip: {
      style: {
        fontSize: '12px'
      },
      y: {
        formatter: function (val) {
          return val + ' funcionários'
        }
      }
    },
    colors: [baseColor, secondaryColor],
    grid: {
      borderColor: borderColor,
      strokeDashArray: 4,
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    markers: {
      strokeColors: [baseColor, secondaryColor],
      strokeWidth: 3
    }
  }
}

export { ChartsWidget1 }