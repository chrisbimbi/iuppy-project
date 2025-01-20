// src/_metronic/partials/widgets/tables/TablesWidget13.tsx

import React from 'react'
import {KTSVG} from '../../../helpers'

type Props = {
  className: string
  data: Array<{
    position: string
    department: string
    responsible: string
    candidates: number
    status: string
  }>
}

const TablesWidget13: React.FC<Props> = ({className, data}) => {
  return (
    <div className={`card ${className}`}>
      {/* begin::Header */}
      <div className='card-header border-0 pt-5'>
        <h3 className='card-title align-items-start flex-column'>
          <span className='card-label fw-bold fs-3 mb-1'>Vagas em Aberto</span>
          <span className='text-muted mt-1 fw-semibold fs-7'>{data.length} vagas ativas</span>
        </h3>
        <div className='card-toolbar'>
          <a href='#' className='btn btn-sm btn-light-primary'>
            <KTSVG path='../media/icons/duotune/arrows/arr075.svg' className='svg-icon-2' />
            Nova Vaga
          </a>
        </div>
      </div>
      {/* end::Header */}
      {/* begin::Body */}
      <div className='card-body py-3'>
        {/* begin::Table container */}
        <div className='table-responsive'>
          {/* begin::Table */}
          <table className='table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3'>
            {/* begin::Table head */}
            <thead>
              <tr className='fw-bold text-muted'>
                <th className='min-w-150px'>Cargo</th>
                <th className='min-w-140px'>Departamento</th>
                <th className='min-w-120px'>Responsável</th>
                <th className='min-w-100px'>Candidatos</th>
                <th className='min-w-100px'>Status</th>
                <th className='min-w-100px text-end'>Ações</th>
              </tr>
            </thead>
            {/* end::Table head */}
            {/* begin::Table body */}
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  <td>
                    <a href='#' className='text-dark fw-bold text-hover-primary fs-6'>
                      {item.position}
                    </a>
                  </td>
                  <td>
                    <span className='text-muted fw-semibold text-muted d-block fs-7'>
                      {item.department}
                    </span>
                  </td>
                  <td>
                    <span className='text-muted fw-semibold text-muted d-block fs-7'>
                      {item.responsible}
                    </span>
                  </td>
                  <td>
                    <span className='text-muted fw-semibold text-muted d-block fs-7'>
                      {item.candidates}
                    </span>
                  </td>
                  <td>
                    <span className='badge badge-light-success'>{item.status}</span>
                  </td>
                  <td className='text-end'>
                    <a
                      href='#'
                      className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'
                    >
                      <KTSVG path='../media/icons/duotune/general/gen019.svg' className='svg-icon-3' />
                    </a>
                    <a
                      href='#'
                      className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'
                    >
                      <KTSVG path='../media/icons/duotune/art/art005.svg' className='svg-icon-3' />
                    </a>
                    <a href='#' className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm'>
                      <KTSVG path='../media/icons/duotune/general/gen027.svg' className='svg-icon-3' />
                    </a>
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

export {TablesWidget13}