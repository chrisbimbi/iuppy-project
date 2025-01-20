// src/_metronic/partials/widgets/lists/ListsWidget9.tsx

import React from 'react'
import {KTSVG} from '../../../helpers'

type Props = {
  className: string
  data: Array<{
    question: string
    topic: string
    occurrences: number
  }>
}

const ListsWidget9: React.FC<Props> = ({className, data}) => {
  return (
    <div className={`card ${className}`}>
      {/* begin::Header */}
      <div className='card-header align-items-center border-0 mt-4'>
        <h3 className='card-title align-items-start flex-column'>
          <span className='fw-bold mb-2 text-dark'>FAQ Mais Frequentes</span>
          <span className='text-muted fw-semibold fs-7'>Tópicos mais recorrentes</span>
        </h3>
        <div className='card-toolbar'>
          {/* begin::Menu */}
          <button
            type='button'
            className='btn btn-sm btn-icon btn-color-primary btn-active-light-primary'
            data-kt-menu-trigger='click'
            data-kt-menu-placement='bottom-end'
            data-kt-menu-flip='top-end'
          >
            <KTSVG path='../media/icons/duotune/general/gen024.svg' className='svg-icon-2' />
          </button>
          {/* end::Menu */}
        </div>
      </div>
      {/* end::Header */}
      {/* begin::Body */}
      <div className='card-body pt-5'>
        {/* begin::Item */}
        {data.map((item, index) => (
          <div key={index} className='d-flex align-items-center mb-7'>
            {/* begin::Symbol */}
            <div className='symbol symbol-50px me-5'>
              <span className='symbol-label bg-light-primary'>
                <KTSVG
                  path='../media/icons/duotune/abstract/abs027.svg'
                  className='svg-icon-2x svg-icon-primary'
                />
              </span>
            </div>
            {/* end::Symbol */}
            {/* begin::Text */}
            <div className='d-flex flex-column'>
              <a href='#' className='text-dark text-hover-primary fs-6 fw-bold'>
                {item.question}
              </a>
              <span className='text-muted fw-semibold'>{item.topic}</span>
            </div>
            {/* end::Text */}
            {/* begin::Badge */}
            <span className='badge badge-light-primary fs-8 fw-bold ms-auto'>{item.occurrences}</span>
            {/* end::Badge */}
          </div>
        ))}
        {/* end::Item */}
      </div>
      {/* end::Body */}
    </div>
  )
}

export {ListsWidget9}