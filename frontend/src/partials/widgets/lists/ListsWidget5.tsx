// src/_metronic/partials/widgets/lists/ListsWidget5.tsx

import React from 'react'
import {KTSVG} from '../../../helpers'

type Props = {
  className: string
  data: Array<{
    title: string
    type: string
    views: number
  }>
}

const ListsWidget5: React.FC<Props> = ({className, data}) => {
  return (
    <div className={`card ${className}`}>
      {/* begin::Header */}
      <div className='card-header align-items-center border-0 mt-4'>
        <h3 className='card-title align-items-start flex-column'>
          <span className='fw-bold mb-2 text-dark'>Conteúdo Multimídia</span>
          <span className='text-muted fw-semibold fs-7'>Vídeos e podcasts mais populares</span>
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
            <KTSVG path='..../media/icons/duotune/general/gen024.svg' className='svg-icon-2' />
          </button>
          {/* end::Menu */}
        </div>
      </div>
      {/* end::Header */}
      {/* begin::Body */}
      <div className='card-body pt-5'>
        {/* begin::Timeline */}
        <div className='timeline-label'>
          {data.map((item, index) => (
            <div key={index} className='timeline-item'>
              {/* begin::Label */}
              <div className='timeline-label fw-bold text-gray-800 fs-6'>{item.views}</div>
              {/* end::Label */}
              {/* begin::Badge */}
              <div className='timeline-badge'>
                <i className={`fa fa-genderless text-${item.type === 'Vídeo' ? 'success' : 'primary'} fs-1`}></i>
              </div>
              {/* end::Badge */}
              {/* begin::Content */}
              <div className='timeline-content d-flex'>
                <span className='fw-bold text-gray-800 ps-3'>{item.title}</span>
              </div>
              {/* end::Content */}
            </div>
          ))}
        </div>
        {/* end::Timeline */}
      </div>
      {/* end: Card Body */}
    </div>
  )
}

export {ListsWidget5}