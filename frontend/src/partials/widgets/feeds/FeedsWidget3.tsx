// src/_metronic/partials/widgets/feeds/FeedsWidget3.tsx

import React from 'react'
import {KTSVG} from '../../../helpers'

type Props = {
  className: string
  data: {
    question: string
    responses: Array<{
      option: string
      percentage: number
    }>
  }
}

const FeedsWidget3: React.FC<Props> = ({className, data}) => {
  return (
    <div className={`card ${className}`}>
      {/* begin::Body */}
      <div className='card-body pb-0'>
        {/* begin::Header */}
        <div className='d-flex align-items-center mb-5'>
          {/* begin::User */}
          <div className='d-flex align-items-center flex-grow-1'>
            {/* begin::Avatar */}
            <div className='symbol symbol-45px me-5'>
              <img src='/media/avatars/300-21.jpg' alt='' />
            </div>
            {/* end::Avatar */}

            {/* begin::Info */}
            <div className='d-flex flex-column'>
              <a href='#' className='text-gray-800 text-hover-primary fs-6 fw-bold'>
                Última Pesquisa
              </a>
              <span className='text-gray-400 fw-semibold'>Resultados da pesquisa mais recente</span>
            </div>
            {/* end::Info */}
          </div>
          {/* end::User */}

          {/* begin::Menu */}
          <div className='my-0'>
            <button
              type='button'
              className='btn btn-sm btn-icon btn-color-primary btn-active-light-primary'
              data-kt-menu-trigger='click'
              data-kt-menu-placement='bottom-end'
              data-kt-menu-flip='top-end'
            >
              <KTSVG path='..../media/icons/duotune/general/gen024.svg' className='svg-icon-2' />
            </button>
          </div>
          {/* end::Menu */}
        </div>
        {/* end::Header */}

        {/* begin::Post */}
        <div className='mb-5'>
          {/* begin::Text */}
          <p className='text-gray-800 fw-normal mb-5'>{data.question}</p>
          {/* end::Text */}

          {/* begin::Responses */}
          {data.responses.map((response, index) => (
            <div key={index} className='d-flex align-items-center mb-5'>
              <span className='fw-bold text-gray-400 fs-5'>{response.option}</span>
              <div className='progress h-5px w-100 ms-5 me-5'>
                <div
                  className='progress-bar bg-success'
                  role='progressbar'
                  style={{width: `${response.percentage}%`}}
                ></div>
              </div>
              <span className='fw-bold text-gray-600 fs-5'>{response.percentage}%</span>
            </div>
          ))}
          {/* end::Responses */}
        </div>
        {/* end::Post */}

        {/* begin::Separator */}
        <div className='separator mb-4'></div>
        {/* end::Separator */}

        {/* begin::Reply input */}
        <form className='position-relative mb-6'>
          <textarea
            className='form-control border-0 p-0 pe-10 resize-none min-h-25px'
            rows={1}
            placeholder='Deixe um comentário...'
          ></textarea>

          <div className='position-absolute top-0 end-0 me-n5'>
            <span className='btn btn-icon btn-sm btn-active-color-primary pe-0 me-2'>
              <KTSVG path='..../media/icons/duotune/communication/com008.svg' className='svg-icon-3 mb-3' />
            </span>

            <span className='btn btn-icon btn-sm btn-active-color-primary ps-0'>
              <KTSVG path='..../media/icons/duotune/general/gen018.svg' className='svg-icon-2 mb-3' />
            </span>
          </div>
        </form>
        {/* edit::Reply input */}
      </div>
      {/* end::Body */}
    </div>
  )
}

export {FeedsWidget3}