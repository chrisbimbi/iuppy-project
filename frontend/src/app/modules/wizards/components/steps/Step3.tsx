import React, { FC } from 'react'
import { Field, ErrorMessage } from 'formik'
import { useIntl } from 'react-intl'

const Step3: FC = () => {
  const intl = useIntl()
  return (
    <div className='w-100'>
      <div className='pb-10 pb-lg-12'>
        <h2 className='fw-bolder text-gray-900'>{intl.formatMessage({ id: 'WIZARDS.STEP3.TITLE', defaultMessage: 'Business Details' })}</h2>

        <div className='text-gray-500 fw-bold fs-6'>
          {intl.formatMessage({ id: 'WIZARDS.COMMON.MORE_INFO', defaultMessage: 'If you need more info, please check out' })}
          <a href='/dashboard' className='link-primary fw-bolder'>
            {' '}
            {intl.formatMessage({ id: 'WIZARDS.COMMON.HELP_PAGE', defaultMessage: 'Help Page' })}
          </a>
          .
        </div>
      </div>

      <div className='fv-row mb-10'>
        <label className='form-label required'>{intl.formatMessage({ id: 'WIZARDS.STEP3.BUSINESS_NAME', defaultMessage: 'Business Name' })}</label>

        <Field name='businessName' className='form-control form-control-lg form-control-solid' />
        <div className='text-danger mt-2'>
          <ErrorMessage name='businessName' />
        </div>
      </div>

      <div className='fv-row mb-10'>
        <label className='d-flex align-items-center form-label'>
          <span className='required'>{intl.formatMessage({ id: 'WIZARDS.STEP3.SHORTENED_DESCRIPTOR', defaultMessage: 'Shortened Descriptor' })}</span>
        </label>

        <Field
          name='businessDescriptor'
          className='form-control form-control-lg form-control-solid'
        />
        <div className='text-danger mt-2'>
          <ErrorMessage name='businessDescriptor' />
        </div>

        <div className='form-text'>
          {intl.formatMessage({ id: 'WIZARDS.STEP3.DESCRIPTOR_HELP', defaultMessage: 'Customers will see this shortened version of your statement descriptor' })}
        </div>
      </div>

      <div className='fv-row mb-10'>
        <label className='form-label required'>{intl.formatMessage({ id: 'WIZARDS.STEP3.CORPORATION_TYPE', defaultMessage: 'Corporation Type' })}</label>

        <Field
          as='select'
          name='businessType'
          className='form-select form-select-lg form-select-solid'
        >
          <option></option>
          <option value='1'>{intl.formatMessage({ id: 'WIZARDS.STEP3.S_CORPORATION', defaultMessage: 'S Corporation' })}</option>
          <option value='1'>{intl.formatMessage({ id: 'WIZARDS.STEP3.C_CORPORATION', defaultMessage: 'C Corporation' })}</option>
          <option value='2'>{intl.formatMessage({ id: 'WIZARDS.STEP3.SOLE_PROPRIETORSHIP', defaultMessage: 'Sole Proprietorship' })}</option>
          <option value='3'>{intl.formatMessage({ id: 'WIZARDS.STEP3.NON_PROFIT', defaultMessage: 'Non-profit' })}</option>
          <option value='4'>{intl.formatMessage({ id: 'WIZARDS.STEP3.LIMITED_LIABILITY', defaultMessage: 'Limited Liability' })}</option>
          <option value='5'>{intl.formatMessage({ id: 'WIZARDS.STEP3.GENERAL_PARTNERSHIP', defaultMessage: 'General Partnership' })}</option>
        </Field>
        <div className='text-danger mt-2'>
          <ErrorMessage name='businessType' />
        </div>
      </div>

      <div className='fv-row mb-10'>
        <label className='form-label'>{intl.formatMessage({ id: 'WIZARDS.STEP3.BUSINESS_DESCRIPTION', defaultMessage: 'Business Description' })}</label>

        <Field
          as='textarea'
          name='businessDescription'
          className='form-control form-control-lg form-control-solid'
          rows={3}
        ></Field>
      </div>

      <div className='fv-row mb-0'>
        <label className='fs-6 fw-bold form-label required'>{intl.formatMessage({ id: 'WIZARDS.STEP3.CONTACT_EMAIL', defaultMessage: 'Contact Email' })}</label>

        <Field name='businessEmail' className='form-control form-control-lg form-control-solid' />
        <div className='text-danger mt-2'>
          <ErrorMessage name='businessEmail' />
        </div>
      </div>
    </div>
  )
}

export { Step3 }
