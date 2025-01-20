import React from 'react'
import {KTSVG} from '../../../helpers'

interface WidgetProps {
  className?: string;
}

const CommunicationImpactWidget: React.FC<WidgetProps> = ({ className }) => {
  return (
    <div className={`card ${className}`}>
      <div className='card-header border-0 pt-5'>
        <h3 className='card-title align-items-start flex-column'>
          <span className='card-label fw-bold fs-3 mb-1'>Impacto da Comunicação</span>
          <span className='text-muted mt-1 fw-semibold fs-7'>Métricas de engajamento</span>
        </h3>
      </div>
      <div className='card-body py-3'>
        <div className='table-responsive'>
          <table className='table align-middle gs-0 gy-4'>
            <thead>
              <tr className='fw-bold text-muted bg-light'>
                <th className='ps-4 min-w-125px rounded-start'>Comunicado</th>
                <th className='min-w-125px'>Visualizações</th>
                <th className='min-w-125px'>Likes</th>
                <th className='min-w-125px'>Comentários</th>
                <th className='min-w-125px rounded-end'>Impacto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className='text-dark fw-bold d-block mb-1 fs-6'>Novo Benefício</span>
                </td>
                <td>
                  <span className='text-dark fw-bold d-block mb-1 fs-6'>4,523</span>
                </td>
                <td>
                  <span className='text-dark fw-bold d-block mb-1 fs-6'>1,234</span>
                </td>
                <td>
                  <span className='text-dark fw-bold d-block mb-1 fs-6'>321</span>
                </td>
                <td>
                  <span className='badge badge-light-success fs-7 fw-bold'>Alto</span>
                </td>
              </tr>
              {/* Adicione mais linhas conforme necessário */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export {CommunicationImpactWidget}