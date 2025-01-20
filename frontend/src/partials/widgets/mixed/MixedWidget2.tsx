// src/_metronic/partials/widgets/mixed/MixedWidget2.tsx

import React, {useEffect, useRef} from 'react'
import ApexCharts, {ApexOptions} from 'apexcharts'
import {getCSSVariableValue} from '../../../assets/ts/_utils'
import {useThemeMode} from '../../layout/theme-mode/ThemeModeProvider'

type Props = {
  className: string
  chartHeight: string
  data: {
    active: number
    total: number
    inactive: number
    monthlyTrend: number[]
  }
}

const MixedWidget2: React.FC<Props> = ({className, chartHeight, data}) => {
  const chartRef = useRef<HTMLDivElement | null>(null)
  const {mode} = useThemeMode()

  useEffect(() => {
    const chart = refreshChart()

    return () => {
      if (chart) {
        chart.destroy()
      }
    }
  }, [chartRef, mode, data, chartHeight])

  const refreshChart = () => {
    if (!chartRef.current) {
      return
    }

    const chart = new ApexCharts(chartRef.current, getChartOptions(chartHeight, data.monthlyTrend))
    chart.render()

    return chart
  }

  return (
    <div className={`card ${className}`}>
      <div className='card-header border-0 py-5'>
        <h3 className='card-title align-items-start flex-column'>
          <span className='card-label fw-bold fs-3 mb-1'>Resumo de Colaboradores</span>
          <span className='text-muted fw-semibold fs-7'>Visão geral dos colaboradores</span>
        </h3>
      </div>
      <div className='card-body p-0 d-flex flex-column'>
        <div
          ref={chartRef}
          className='mixed-widget-2-chart card-rounded-bottom'
        ></div>

        <div className='card-p mt-n20 position-relative'>
          <div className='row g-0'>
            <div className='col bg-light-warning px-6 py-8 rounded-2 me-7 mb-7'>
              <span className='svg-icon svg-icon-3x svg-icon-warning d-block my-2'>
                <i className='bi bi-person fs-1'></i>
              </span>
              <a href='#' className='text-warning fw-semibold fs-6'>
                Colaboradores Ativos: {data.active}
              </a>
            </div>
            <div className='col bg-light-primary px-6 py-8 rounded-2 mb-7'>
              <span className='svg-icon svg-icon-3x svg-icon-primary d-block my-2'>
                <i className='bi bi-people fs-1'></i>
              </span>
              <a href='#' className='text-primary fw-semibold fs-6'>
                Total Cadastrados: {data.total}
              </a>
            </div>
          </div>
          <div className='row g-0'>
            <div className='col bg-light-danger px-6 py-8 rounded-2 me-7'>
              <span className='svg-icon svg-icon-3x svg-icon-danger d-block my-2'>
                <i className='bi bi-person-dash fs-1'></i>
              </span>
              <a href='#' className='text-danger fw-semibold fs-6 mt-2'>
                Colaboradores Inativos: {data.inactive}
              </a>
            </div>
            <div className='col bg-light-success px-6 py-8 rounded-2'>
              <span className='svg-icon svg-icon-3x svg-icon-success d-block my-2'>
                <i className='bi bi-envelope-plus fs-1'></i>
              </span>
              <a href='#' className='text-success fw-semibold fs-6 mt-2'>
                Convidar Novamente
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const getChartOptions = (chartHeight: string, data: number[]): ApexOptions => {
  const iuppyBlue = '#22B4FF'
  const iuppyOrange = '#FFA801'
  const iuppyDarkBlue = '#090E48'
  
  return {
    series: [{
      name: 'Colaboradores Ativos',
      data: data
    }],
    chart: {
      fontFamily: 'inherit',
      type: 'area',
      height: chartHeight,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      sparkline: {
        enabled: true
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
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.7,
        stops: [0, 90, 100]
      },
      colors: [iuppyBlue]
    },
    stroke: {
      curve: 'smooth',
      show: true,
      width: 3,
      colors: [iuppyBlue]
    },
    xaxis: {
      categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false
      },
      labels: {
        show: false,
        style: {
          colors: iuppyDarkBlue,
          fontSize: '12px'
        }
      },
      crosshairs: {
        show: false,
        position: 'front',
        stroke: {
          color: iuppyOrange,
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
      min: 0,
      max: 300,
      labels: {
        show: false,
        style: {
          colors: iuppyDarkBlue,
          fontSize: '12px'
        }
      }
    },
    states: {
      normal: {
        filter: {
          type: 'none',
          value: 0
        }
      },
      hover: {
        filter: {
          type: 'none',
          value: 0
        }
      },
      active: {
        allowMultipleDataPointsSelection: false,
        filter: {
          type: 'none',
          value: 0
        }
      }
    },
    tooltip: {
      style: {
        fontSize: '12px'
      },
      y: {
        formatter: function (val) {
          return val + ' colaboradores'
        }
      }
    },
    colors: [iuppyBlue],
    markers: {
      colors: [iuppyBlue],
      strokeColors: [iuppyOrange],
      strokeWidth: 3
    }
  }
}

export {MixedWidget2}