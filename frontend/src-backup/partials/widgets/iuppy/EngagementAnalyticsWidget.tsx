import React from 'react'
import {KTSVG} from '../../../helpers'
import {Dropdown1} from '../../content/dropdown/Dropdown1'
import ReactApexChart from 'react-apexcharts'
import {ApexOptions} from 'apexcharts'

interface WidgetProps {
  className?: string;
}

const EngagementAnalyticsWidget: React.FC<WidgetProps> = ({ className }) => {
  const chartOptions: ApexOptions = {
    series: [{
      name: 'Engajamento',
      data: [31, 40, 28, 51, 42, 109, 100]
    }],
    chart: {
      height: 350,
      type: 'area'
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth'
    },
    xaxis: {
      type: 'datetime',
      categories: ["2018-09-19T00:00:00.000Z", "2018-09-19T01:30:00.000Z", "2018-09-19T02:30:00.000Z", "2018-09-19T03:30:00.000Z", "2018-09-19T04:30:00.000Z", "2018-09-19T05:30:00.000Z", "2018-09-19T06:30:00.000Z"]
    },
    tooltip: {
      x: {
        format: 'dd/MM/yy HH:mm'
      },
    },
  };

  return (
    <div className={`card ${className}`}>
      <div className='card-header border-0 pt-5'>
        <h3 className='card-title align-items-start flex-column'>
          <span className='card-label fw-bold fs-3 mb-1'>Análise de Engajamento</span>
          <span className='text-muted mt-1 fw-semibold fs-7'>Últimos 90 dias</span>
        </h3>
        <div className='card-toolbar'>
          <button
            type='button'
            className='btn btn-sm btn-icon btn-color-primary btn-active-light-primary'
            data-kt-menu-trigger='click'
            data-kt-menu-placement='bottom-end'
            data-kt-menu-flip='top-end'
          >
            <KTSVG path='/media/icons/duotune/general/gen024.svg' className='svg-icon-2' />
          </button>
          <Dropdown1 />
        </div>
      </div>
      <div className='card-body'>
        <ReactApexChart options={chartOptions} series={chartOptions.series} type='area' height={350} />
      </div>
    </div>
  )
}

export {EngagementAnalyticsWidget}