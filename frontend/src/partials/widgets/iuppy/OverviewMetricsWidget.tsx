import React from 'react'
import {KTSVG} from '../../../helpers'

interface WidgetProps {
  className?: string;
}

const OverviewMetricsWidget: React.FC<WidgetProps> = ({ className }) => {
  return (
    <div className={`card ${className}`}>
      <div className='card-header border-0 pt-5'>
        <h3 className='card-title align-items-start flex-column'>
          <span className='card-label fw-bold fs-3 mb-1'>Visão Geral</span>
          <span className='text-muted mt-1 fw-semibold fs-7'>Métricas principais</span>
        </h3>
      </div>
      <div className='card-body'>
        <div className='d-flex align-items-center mb-8'>
          <KTSVG
            path='../media/icons/duotune/general/gen049.svg'
            className='svg-icon-3x svg-icon-primary me-5'
          />
          <div>
            <div className='fs-5 text-dark fw-bold lh-1'>5,724</div>
            <div className='fs-7 text-muted fw-semibold'>Total de Colaboradores</div>
          </div>
        </div>
        <div className='d-flex align-items-center mb-8'>
          <KTSVG
            path='../media/icons/duotune/arrows/arr066.svg'
            className='svg-icon-3x svg-icon-success me-5'
          />
          <div>
            <div className='fs-5 text-dark fw-bold lh-1'>4,836</div>
            <div className='fs-7 text-muted fw-semibold'>Downloads do App</div>
          </div>
        </div>
        <div className='d-flex align-items-center'>
          <KTSVG
            path='../media/icons/duotune/general/gen032.svg'
            className='svg-icon-3x svg-icon-info me-5'
          />
          <div>
            <div className='fs-5 text-dark fw-bold lh-1'>84.5%</div>
            <div className='fs-7 text-muted fw-semibold'>Taxa de Adoção</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export {OverviewMetricsWidget}