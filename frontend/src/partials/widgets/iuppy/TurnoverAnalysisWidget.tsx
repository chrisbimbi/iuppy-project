import React from 'react'
import {KTSVG} from '../../../helpers'
import ReactApexChart from 'react-apexcharts'
import {ApexOptions} from 'apexcharts'

interface WidgetProps {
  className?: string;
}

const TurnoverAnalysisWidget: React.FC<WidgetProps> = ({ className }) => {
  const chartOptions: ApexOptions = {
    series: [{
      name: 'Turnover',
      data: [2.3, 3.1, 4.0, 3.8, 3.2, 2.8, 2.5]
    }],
    chart: {
      height: 350,
      type: 'line',
    },
    stroke: {
      width: 7,
      curve: 'smooth'
    },
    xaxis: {
      categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
    },
    title: {
      text: 'Índice de Turnover (%)',
      align: 'left'
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        gradientToColors: [ '#FDD835'],
        shadeIntensity: 1,
        type: 'horizontal',
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100, 100, 100]
      },
    },
  };

  return (
    <div className={`card ${className}`}>
      <div className='card-header border-0 pt-5'>
        <h3 className='card-title align-items-start flex-column'>
          <span className='card-label fw-bold fs-3 mb-1'>Análise de Turnover</span>
          <span className='text-muted mt-1 fw-semibold fs-7'>Tendências e causas</span>
        </h3>
      </div>
      <div className='card-body'>
        <ReactApexChart options={chartOptions} series={chartOptions.series} type='line' height={350} />
      </div>
    </div>
  )
}

export {TurnoverAnalysisWidget}