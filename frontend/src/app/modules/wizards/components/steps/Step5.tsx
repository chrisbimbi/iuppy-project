import React, { FC } from 'react'
import { KTIcon } from '../../../../..//helpers'
import { Link } from 'react-router-dom'
import { useIntl } from 'react-intl'

const Step5: FC = () => {
  const intl = useIntl()
  return (
    <div className='w-100'>
      <div className='pb-8 pb-lg-10'>
        <h2 className='fw-bolder text-gray-900'>{intl.formatMessage({ id: 'WIZARDS.STEP5.TITLE', defaultMessage: 'Your Are Done!' })}</h2>

        <div className='text-gray-500 fw-bold fs-6'>
          {intl.formatMessage({ id: 'WIZARDS.COMMON.MORE_INFO_SHORT', defaultMessage: 'If you need more info, please' })}
          <Link to='/auth/login' className='link-primary fw-bolder'>
            {' '}
            {intl.formatMessage({ id: 'WIZARDS.COMMON.SIGN_IN', defaultMessage: 'Sign In' })}
          </Link>
          .
        </div>
      </div>

      <div className='mb-0'>
        <div className='fs-6 text-gray-600 mb-5'>
          {intl.formatMessage({ id: 'WIZARDS.STEP5.DESC', defaultMessage: 'Writing headlines for blog posts is as much an art as it is a science and probably warrants its own post, but for all advise is with what works for your great & amazing audience.' })}
        </div>

        <div className='notice d-flex bg-light-warning rounded border-warning border border-dashed p-6'>
          <KTIcon iconName='information-5' className='fs-2tx text-warning me-4' />
          <div className='d-flex flex-stack flex-grow-1'>
            <div className='fw-bold'>
              <h4 className='text-gray-800 fw-bolder'>{intl.formatMessage({ id: 'WIZARDS.STEP5.ATTENTION_TITLE', defaultMessage: 'We need your attention!' })}</h4>
              <div className='fs-6 text-gray-600'>
                {intl.formatMessage({ id: 'WIZARDS.STEP5.ATTENTION_DESC', defaultMessage: 'To start using great tools, please, please' })}
                <a href='/dashboard' className='fw-bolder'>
                  {' '}
                  {intl.formatMessage({ id: 'WIZARDS.STEP5.CREATE_TEAM_PLATFORM', defaultMessage: 'Create Team Platform' })}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { Step5 }
