import React from 'react'
import {KTSVG} from '../../../helpers'
import ReactApexChart from 'react-apexcharts'
import {ApexOptions} from 'apexcharts'

interface WidgetProps {
  className?: string;
}

const DepartmentEngagementWidget: React.FC<WidgetProps> = ({ className }) => {
  const chartOptions: ApexOptions = {
    series: [{
      data: [44, 55, 41, 64, 22, 43, 21]
    }],
    chart: {
      type: 'bar',
      height: 350
    },
    plotOptions: {
      bar: {
        horizontal: true,
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: ['RH', 'TI', 'Marketing', 'Vendas', 'Finanças', 'Operações', 'Jurídico'],
    }
  };

  return (
    <div className={`card ${className}`}>
      <div className='card-header border-0 pt-5'>
        <h3 className='card-title align-items-start flex-column'>
          <span className='card-label fw-bold fs-3 mb-1'>Engajamento por Departamento</span>
          <span className='text-muted mt-1 fw-semibold fs-7'>Análise comparativa</span>
        </h3>
      </div>
      <div className='card-body'>
        <ReactApexChart options={chartOptions} series={chartOptions.series} type='bar' height={350} />
      </div>
    </div>
  )
}

export {DepartmentEngagementWidget}