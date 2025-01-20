import React from 'react'
import {KTSVG} from '../../../helpers'
import ReactApexChart from 'react-apexcharts'
import {ApexOptions} from 'apexcharts'

interface WidgetProps {
  className?: string;
}

const RoleBasedEngagementWidget: React.FC<WidgetProps> = ({ className }) => {
  const chartOptions: ApexOptions = {
    series: [44, 55, 13, 43, 22],
    chart: {
      width: 380,
      type: 'pie',
    },
    labels: ['Gerentes', 'Supervisores', 'Analistas', 'Assistentes', 'Estagiários'],
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  return (
    <div className={`card ${className}`}>
      <div className='card-header border-0 pt-5'>
        <h3 className='card-title align-items-start flex-column'>
          <span className='card-label fw-bold fs-3 mb-1'>Engajamento por Cargo</span>
          <span className='text-muted mt-1 fw-semibold fs-7'>Distribuição</span>
        </h3>
      </div>
      <div className='card-body'>
        <ReactApexChart options={chartOptions} series={chartOptions.series} type='pie' width={380} />
      </div>
    </div>
  )
}

export {RoleBasedEngagementWidget}