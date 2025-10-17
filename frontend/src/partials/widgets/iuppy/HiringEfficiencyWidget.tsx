import React from 'react'
import {KTSVG} from '../../../helpers'

const HiringEfficiencyWidget: React.FC = () => {
  return (
    <div className='card'>
      <div className='card-header border-0 pt-5'>
        <h3 className='card-title align-items-start flex-column'>
          <span className='card-label fw-bold fs-3 mb-1'>Eficiência de Contratação</span>
          <span className='text-muted mt-1 fw-semibold fs-7'>Métricas do processo</span>
        </h3>
      </div>
      <div className='card-body'>
        <div className='d-flex align-items-center mb-8'>
          <KTSVG
            path='..../media/icons/duotune/general/gen013.svg'
            className='svg-icon-3x svg-icon-primary me-5'
          />
          <div>
            <div className='fs-5 text-dark fw-bold lh-1'>23 dias</div>
            <div className='fs-7 text-muted fw-semibold'>Tempo Médio de Contratação</div>
          </div>
        </div>
        <div className='d-flex align-items-center mb-8'>
          <KTSVG
            path='..../media/icons/duotune/general/gen029.svg'
            className='svg-icon-3x svg-icon-success me-5'
          />
          <div>
            <div className='fs-5 text-dark fw-bold lh-1'>87%</div>
            <div className='fs-7 text-muted fw-semibold'>Taxa de Aceitação de Ofertas</div>
          </div>
        </div>
        <div className='d-flex align-items-center'>
          <KTSVG
            path='..../media/icons/duotune/general/gen017.svg'
            className='svg-icon-3x svg-icon-warning me-5'
          />
          <div>
            <div className='fs-5 text-dark fw-bold lh-1'>12</div>
            <div className='fs-7 text-muted fw-semibold'>Vagas Abertas Atualmente</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export {HiringEfficiencyWidget}