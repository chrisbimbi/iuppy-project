// src/_metronic/partials/widgets/tables/TablesWidget10.tsx

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

const TablesWidget10: React.FC<Props> = ({className, data}) => {
  return (
    <div className={`card ${className}`}>
      {/* begin::Header */}
      <div className='card-header border-0 pt-5'>
        <h3 className='card-title align-items-start flex-column'>
          <span className='card-label fw-bold fs-3 mb-1'>Engajamento de Conteúdos</span>
          <span className='text-muted mt-1 fw-semibold fs-7'>Mais de {data.length} conteúdos</span>
        </h3>
      </div>
      {/* end::Header */}
      {/* begin::Body */}
      <div className='card-body py-3'>
        {/* begin::Table container */}
        <div className='table-responsive'>
          {/* begin::Table */}
          <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
            {/* begin::Table head */}
            <thead>
              <tr className='fw-bold text-muted'>
                <th className='min-w-150px'>Título</th>
                <th className='min-w-140px'>Tipo</th>
                <th className='min-w-120px'>Visualizações</th>
                <th className='min-w-100px text-end'>Ações</th>
              </tr>
            </thead>
            {/* end::Table head */}
            {/* begin::Table body */}
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  <td>
                    <a href='#' className='text-dark fw-bold text-hover-primary d-block fs-6'>
                      {item.title}
                    </a>
                  </td>
                  <td>
                    <span className='text-muted fw-semibold text-muted d-block fs-7'>{item.type}</span>
                  </td>
                  <td className='text-end'>
                    <span className='text-muted fw-semibold text-muted d-block fs-7'>{item.views}</span>
                  </td>
                  <td>
                    <div className='d-flex justify-content-end flex-shrink-0'>
                      <a
                        href='#'
                        className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'
                      >
                        <KTSVG path='..../media/icons/duotune/general/gen019.svg' className='svg-icon-3' />
                      </a>
                      <a
                        href='#'
                        className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'
                      >
                        <KTSVG path='..../media/icons/duotune/art/art005.svg' className='svg-icon-3' />
                      </a>
                      <a href='#' className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm'>
                        <KTSVG path='..../media/icons/duotune/general/gen027.svg' className='svg-icon-3' />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* end::Table body */}
          </table>
          {/* end::Table */}
        </div>
        {/* end::Table container */}
      </div>
      {/* begin::Body */}
    </div>
  )
}

export {TablesWidget10}