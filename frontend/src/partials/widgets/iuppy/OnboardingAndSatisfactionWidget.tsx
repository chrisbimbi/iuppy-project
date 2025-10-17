import React, {useState} from 'react'
import {KTSVG} from '../../../helpers'

interface WidgetProps {
  className?: string;
}

const OnboardingAndSatisfactionWidget: React.FC<WidgetProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState('onboarding')

  return (
    <div className={`card ${className}`}>
      <div className='card-header border-0 pt-5'>
        <h3 className='card-title align-items-start flex-column'>
          <span className='card-label fw-bold fs-3 mb-1'>Onboarding e Satisfação</span>
          <span className='text-muted mt-1 fw-semibold fs-7'>Análise de processos e feedback</span>
        </h3>
        <div className='card-toolbar'>
          <ul className='nav nav-pills nav-pills-sm nav-light'>
            <li className='nav-item'>
              <a
                className={`nav-link btn btn-active-light btn-color-muted py-2 px-4 ${
                  activeTab === 'onboarding' ? 'active' : ''
                }`}
                data-bs-toggle='tab'
                href='#'
                onClick={() => setActiveTab('onboarding')}
              >
                Onboarding
              </a>
            </li>
            <li className='nav-item'>
              <a
                className={`nav-link btn btn-active-light btn-color-muted py-2 px-4 ${
                  activeTab === 'satisfaction' ? 'active' : ''
                }`}
                data-bs-toggle='tab'
                href='#'
                onClick={() => setActiveTab('satisfaction')}
              >
                Satisfação
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className='card-body py-3'>
        <div className='tab-content'>
          <div className={`tab-pane fade ${activeTab === 'onboarding' ? 'show active' : ''}`}>
            <div className='d-flex flex-wrap justify-content-between mt-4'>
              <div className='d-flex flex-column me-2'>
                <span className='fw-bold fs-6 mb-2'>Processos em Andamento</span>
                <span className='fw-semibold fs-2'>24</span>
              </div>
              <div className='d-flex flex-column me-2'>
                <span className='fw-bold fs-6 mb-2'>Conclusão Média</span>
                <span className='fw-semibold fs-2'>68%</span>
              </div>
              <div className='d-flex flex-column'>
                <span className='fw-bold fs-6 mb-2'>Tempo Médio</span>
                <span className='fw-semibold fs-2'>14 dias</span>
              </div>
            </div>
          </div>
          <div className={`tab-pane fade ${activeTab === 'satisfaction' ? 'show active' : ''}`}>
            <div className='d-flex flex-wrap justify-content-between mt-4'>
              <div className='d-flex flex-column me-2'>
                <span className='fw-bold fs-6 mb-2'>Satisfação após 90 dias</span>
                <span className='fw-semibold fs-2'>87%</span>
              </div>
              <div className='d-flex flex-column me-2'>
                <span className='fw-bold fs-6 mb-2'>Satisfação Final</span>
                <span className='fw-semibold fs-2'>92%</span>
              </div>
              <div className='d-flex flex-column'>
                <span className='fw-bold fs-6 mb-2'>Tendência</span>
                <span className='fw-semibold fs-2 text-success'>+5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export {OnboardingAndSatisfactionWidget}