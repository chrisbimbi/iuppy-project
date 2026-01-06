import { FC } from 'react'
import { ApexOptions } from 'apexcharts'
import { BaseChart } from '../../../app/components/charts/BaseChart'
import { getCSSVariableValue } from '../../../assets/ts/_utils'
import { useThemeMode } from '../../layout/theme-mode/ThemeModeProvider'

type Props = {
  className: string
  chartColor: string
  chartHeight: string
  data?: {
    series: { name: string; data: number[] }[]
    categories: string[]
  }
}

const MixedWidget10: FC<Props> = ({ className, chartColor, chartHeight, data }) => {
  const { mode } = useThemeMode()

  // Default data if not provided
  const chartData = data || {
    series: [{ name: 'Net Profit', data: [15, 25, 15, 40, 20, 50] }],
    categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
  }

  return (
    <div className={`card ${className} `}>
      {/* begin::Body */}
      <div className='card-body d-flex flex-column p-0'>
        {/* begin::Stats */}
        <div className='flex-grow-1 card-p pb-0'>
          <div className='d-flex flex-stack flex-wrap'>
            <div className='me-2'>
              <a href='#' className='text-gray-900 text-hover-primary fw-bold fs-3'>
                Generate Reports
              </a>

              <div className='text-muted fs-7 fw-semibold'>Finance and accounting reports</div>
            </div>

            <div className={`fw-bold fs-3 text-${chartColor}`}>$24,500</div>
          </div>
        </div>
        {/* end::Stats */}

        {/* begin::Chart */}
        <BaseChart className='mixed-widget-7-chart card-rounded-bottom' options={chartOptions(chartColor, chartHeight, chartData)} height={chartHeight} />
        {/* end::Chart */}
      </div>
      {/* end::Body */}
    </div>
  )
}

const chartOptions = (chartColor: string, chartHeight: string, data: { series: any[]; categories: string[] }): ApexOptions => {
  const labelColor = getCSSVariableValue('--bs-gray-800')
  const strokeColor = getCSSVariableValue('--bs-gray-300')
  const baseColor = getCSSVariableValue('--bs-' + chartColor)
  const lightColor = getCSSVariableValue('--bs-' + chartColor + '-light')

  return {
    series: data.series,
    chart: {
      fontFamily: 'inherit',
      type: 'area',
      height: chartHeight,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {},
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    fill: {
      type: 'solid',
      opacity: 1,
    },
    stroke: {
      curve: 'smooth',
      show: true,
      width: 3,
      colors: [baseColor],
    },
    xaxis: {
      categories: data.categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        show: false,
        style: {
          colors: labelColor,
          fontSize: '12px',
        },
      },
      crosshairs: {
        show: false,
        position: 'front',
        stroke: {
          color: strokeColor,
          width: 1,
          dashArray: 3,
        },
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      min: 0,
      max: 60,
      labels: {
        show: false,
        style: {
          colors: labelColor,
          fontSize: '12px',
        },
      },
    },
    states: {
      normal: {
        filter: {
          type: 'none',
        },
      },
      hover: {
        filter: {
          type: 'none',
        },
      },
      active: {
        allowMultipleDataPointsSelection: false,
        filter: {
          type: 'none',
        },
      },
    },
    tooltip: {
      style: {
        fontSize: '12px',
      },
      y: {
        formatter: function (val) {
          return '$' + val + ' thousands'
        },
      },
    },
    colors: [lightColor],
    markers: {
      colors: [lightColor],
      strokeColors: [baseColor],
      strokeWidth: 3,
    },
  }
}

export { MixedWidget10 }
