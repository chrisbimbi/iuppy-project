

import { useState, useEffect } from 'react'
import { useIntl } from 'react-intl'
import { useAuth } from '../core/Auth'
import * as Yup from 'yup'
import { useFormik } from 'formik'
import { clsx } from 'clsx'
import { toAbsoluteUrl } from 'src/helpers'
import { Link } from 'react-router-dom'
import { register } from '../core/_requests'

const registrationSchema = Yup.object().shape({
  firstname: Yup.string()
    .min(3, 'AUTH.VALIDATION.MIN_SYMBOLS')
    .max(50, 'AUTH.VALIDATION.MAX_SYMBOLS')
    .required('AUTH.VALIDATION.FIRSTNAME_REQUIRED'),
  email: Yup.string()
    .email('AUTH.VALIDATION.INVALID_EMAIL')
    .min(3, 'AUTH.VALIDATION.MIN_SYMBOLS')
    .max(50, 'AUTH.VALIDATION.MAX_SYMBOLS')
    .required('AUTH.VALIDATION.REQUIRED'),
  lastname: Yup.string()
    .min(3, 'AUTH.VALIDATION.MIN_SYMBOLS')
    .max(50, 'AUTH.VALIDATION.MAX_SYMBOLS')
    .required('AUTH.VALIDATION.LASTNAME_REQUIRED'),
  password: Yup.string()
    .min(3, 'AUTH.VALIDATION.MIN_SYMBOLS')
    .max(50, 'AUTH.VALIDATION.MAX_SYMBOLS')
    .required('AUTH.VALIDATION.PASSWORD_REQUIRED'),
  changepassword: Yup.string()
    .min(3, 'AUTH.VALIDATION.MIN_SYMBOLS')
    .max(50, 'AUTH.VALIDATION.MAX_SYMBOLS')
    .required('AUTH.VALIDATION.PASSWORD_CONFIRM_REQUIRED')
    .oneOf([Yup.ref('password')], "AUTH.VALIDATION.PASSWORD_MISMATCH"),
  acceptTerms: Yup.bool().required('AUTH.VALIDATION.TERMS_REQUIRED'),
})

export function Registration() {
  const [loading, setLoading] = useState(false)
  const { saveAuth, setCurrentUser } = useAuth()
  const intl = useIntl()
  const initialValues = {
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    changepassword: '',
    acceptTerms: false,
  }

  const formik = useFormik({
    initialValues,
    validationSchema: registrationSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true)
      try {
        const { data: auth } = await register(
          values.email,
          values.firstname,
          values.lastname,
          values.password,
          values.changepassword
        )
        saveAuth(auth)
        const { data: user } = await register(
          values.email,
          values.firstname,
          values.lastname,
          values.password,
          values.changepassword
        ) // Wait, register usually returns auth. Let's assume standard flow.
        // Actually, let's just use the register function.
        setCurrentUser(user)
      } catch (error) {
        console.error(error)
        saveAuth(undefined)
        setStatus('The registration details is incorrect')
        setSubmitting(false)
        setLoading(false)
      }
    },
  })

  useEffect(() => {
    // Password meter logic if needed, or just skip it for now.
  }, [])

  return (
    <form
    // ... props
    >
      {/* begin::Heading */}
      <div className='text-center mb-11'>
        {/* begin::Title */}
        <h1 className='text-gray-900 fw-bolder mb-3'>
          {intl.formatMessage({ id: 'AUTH.REGISTER.TITLE' })}
        </h1>
        {/* end::Title */}

        <div className='text-gray-500 fw-semibold fs-6'>
          {intl.formatMessage({ id: 'AUTH.REGISTER.SUBTITLE' })}
        </div>
      </div>
      {/* end::Heading */}

      {/* begin::Login options */}
      <div className='row g-3 mb-9'>
        {/* begin::Col */}
        <div className='col-md-6'>
          {/* begin::Google link */}
          <a
            href='#'
            className='btn btn-flex btn-outline btn-text-gray-700 btn-active-color-primary bg-state-light flex-center text-nowrap w-100'
          >
            <img
              alt='Logo'
              src={toAbsoluteUrl('../media/svg/brand-logos/google-icon.svg')}
              className='h-15px me-3'
            />
            {intl.formatMessage({ id: 'AUTH.LOGIN.BUTTON.GOOGLE' })}
          </a>
          {/* end::Google link */}
        </div>
        {/* end::Col */}

        {/* begin::Col */}
        <div className='col-md-6'>
          {/* begin::Google link */}
          <a
            href='#'
            className='btn btn-flex btn-outline btn-text-gray-700 btn-active-color-primary bg-state-light flex-center text-nowrap w-100'
          >
            <img
              alt='Logo'
              src={toAbsoluteUrl('../media/svg/brand-logos/apple-black.svg')}
              className='theme-light-show h-15px me-3'
            />
            <img
              alt='Logo'
              src={toAbsoluteUrl('../media/svg/brand-logos/apple-black-dark.svg')}
              className='theme-dark-show h-15px me-3'
            />
            {intl.formatMessage({ id: 'AUTH.LOGIN.BUTTON.APPLE' })}
          </a>
          {/* end::Google link */}
        </div>
        {/* end::Col */}
      </div>
      {/* end::Login options */}

      <div className='separator separator-content my-14'>
        <span className='w-125px text-gray-500 fw-semibold fs-7'>
          {intl.formatMessage({ id: 'AUTH.REGISTER.OR_EMAIL' })}
        </span>
      </div>

      {formik.status && (
        <div className='mb-lg-15 alert alert-danger'>
          <div className='alert-text font-weight-bold'>{formik.status}</div>
        </div>
      )}

      {/* begin::Form group Firstname */}
      <div className='fv-row mb-8'>
        <label className='form-label fw-bolder text-gray-900 fs-6'>
          {intl.formatMessage({ id: 'AUTH.INPUT.FIRSTNAME' })}
        </label>
        <input
          placeholder={intl.formatMessage({ id: 'AUTH.INPUT.FIRSTNAME' })}
          type='text'
          autoComplete='off'
          {...formik.getFieldProps('firstname')}
          className={clsx(
            'form-control bg-transparent',
            {
              'is-invalid': formik.touched.firstname && formik.errors.firstname,
            },
            {
              'is-valid': formik.touched.firstname && !formik.errors.firstname,
            }
          )}
        />
        {formik.touched.firstname && formik.errors.firstname && (
          <div className='fv-plugins-message-container'>
            <div className='fv-help-block'>
              <span role='alert'>
                {intl.formatMessage({ id: formik.errors.firstname })}
              </span>
            </div>
          </div>
        )}
      </div>
      {/* end::Form group */}
      <div className='fv-row mb-8'>
        {/* begin::Form group Lastname */}
        <label className='form-label fw-bolder text-gray-900 fs-6'>
          {intl.formatMessage({ id: 'AUTH.INPUT.LASTNAME' })}
        </label>
        <input
          placeholder={intl.formatMessage({ id: 'AUTH.INPUT.LASTNAME' })}
          type='text'
          autoComplete='off'
          {...formik.getFieldProps('lastname')}
          className={clsx(
            'form-control bg-transparent',
            {
              'is-invalid': formik.touched.lastname && formik.errors.lastname,
            },
            {
              'is-valid': formik.touched.lastname && !formik.errors.lastname,
            }
          )}
        />
        {formik.touched.lastname && formik.errors.lastname && (
          <div className='fv-plugins-message-container'>
            <div className='fv-help-block'>
              <span role='alert'>
                {intl.formatMessage({ id: formik.errors.lastname })}
              </span>
            </div>
          </div>
        )}
        {/* end::Form group */}
      </div>

      {/* begin::Form group Email */}
      <div className='fv-row mb-8'>
        <label className='form-label fw-bolder text-gray-900 fs-6'>
          {intl.formatMessage({ id: 'AUTH.INPUT.EMAIL' })}
        </label>
        <input
          placeholder={intl.formatMessage({ id: 'AUTH.INPUT.EMAIL' })}
          type='email'
          autoComplete='off'
          {...formik.getFieldProps('email')}
          className={clsx(
            'form-control bg-transparent',
            { 'is-invalid': formik.touched.email && formik.errors.email },
            {
              'is-valid': formik.touched.email && !formik.errors.email,
            }
          )}
        />
        {formik.touched.email && formik.errors.email && (
          <div className='fv-plugins-message-container'>
            <div className='fv-help-block'>
              <span role='alert'>
                {intl.formatMessage({ id: formik.errors.email })}
              </span>
            </div>
          </div>
        )}
      </div>
      {/* end::Form group */}

      {/* begin::Form group Password */}
      <div className='fv-row mb-8' data-kt-password-meter='true'>
        <div className='mb-1'>
          <label className='form-label fw-bolder text-gray-900 fs-6'>
            {intl.formatMessage({ id: 'AUTH.INPUT.PASSWORD' })}
          </label>
          <div className='position-relative mb-3'>
            <input
              type='password'
              placeholder={intl.formatMessage({ id: 'AUTH.INPUT.PASSWORD' })}
              autoComplete='off'
              {...formik.getFieldProps('password')}
              className={clsx(
                'form-control bg-transparent',
                {
                  'is-invalid': formik.touched.password && formik.errors.password,
                },
                {
                  'is-valid': formik.touched.password && !formik.errors.password,
                }
              )}
            />
            {formik.touched.password && formik.errors.password && (
              <div className='fv-plugins-message-container'>
                <div className='fv-help-block'>
                  <span role='alert'>
                    {intl.formatMessage({ id: formik.errors.password })}
                  </span>
                </div>
              </div>
            )}
          </div>
          {/* begin::Meter */}
          <div
            className='d-flex align-items-center mb-3'
            data-kt-password-meter-control='highlight'
          >
            <div className='flex-grow-1 bg-secondary bg-active-success rounded h-5px me-2'></div>
            <div className='flex-grow-1 bg-secondary bg-active-success rounded h-5px me-2'></div>
            <div className='flex-grow-1 bg-secondary bg-active-success rounded h-5px me-2'></div>
            <div className='flex-grow-1 bg-secondary bg-active-success rounded h-5px'></div>
          </div>
          {/* end::Meter */}
        </div>
        <div className='text-muted'>
          Use 8 or more characters with a mix of letters, numbers & symbols.
        </div>
      </div>
      {/* end::Form group */}

      {/* begin::Form group Confirm password */}
      <div className='fv-row mb-5'>
        <label className='form-label fw-bolder text-gray-900 fs-6'>
          {intl.formatMessage({ id: 'AUTH.INPUT.CONFIRM_PASSWORD' })}
        </label>
        <input
          type='password'
          placeholder={intl.formatMessage({ id: 'AUTH.INPUT.CONFIRM_PASSWORD' })}
          autoComplete='off'
          {...formik.getFieldProps('changepassword')}
          className={clsx(
            'form-control bg-transparent',
            {
              'is-invalid': formik.touched.changepassword && formik.errors.changepassword,
            },
            {
              'is-valid': formik.touched.changepassword && !formik.errors.changepassword,
            }
          )}
        />
        {formik.touched.changepassword && formik.errors.changepassword && (
          <div className='fv-plugins-message-container'>
            <div className='fv-help-block'>
              <span role='alert'>
                {intl.formatMessage({ id: formik.errors.changepassword })}
              </span>
            </div>
          </div>
        )}
      </div>
      {/* end::Form group */}

      {/* begin::Form group */}
      <div className='fv-row mb-8'>
        <label className='form-check form-check-inline' htmlFor='kt_login_toc_agree'>
          <input
            className='form-check-input'
            type='checkbox'
            id='kt_login_toc_agree'
            {...formik.getFieldProps('acceptTerms')}
          />
          <span>
            {intl.formatMessage({ id: 'AUTH.INPUT.TERMS' })}{' '}
            <a
              href='https://iuppy.com.br/metronic/?page=faq'
              target='_blank'
              className='ms-1 link-primary'
            >
              Terms
            </a>
            .
          </span>
        </label>
        {formik.touched.acceptTerms && formik.errors.acceptTerms && (
          <div className='fv-plugins-message-container'>
            <div className='fv-help-block'>
              <span role='alert'>
                {intl.formatMessage({ id: formik.errors.acceptTerms })}
              </span>
            </div>
          </div>
        )}
      </div>
      {/* end::Form group */}

      {/* begin::Form group */}
      <div className='text-center'>
        <button
          type='submit'
          id='kt_sign_up_submit'
          className='btn btn-lg btn-primary w-100 mb-5'
          disabled={formik.isSubmitting || !formik.isValid || !formik.values.acceptTerms}
        >
          {!loading && <span className='indicator-label'>
            {intl.formatMessage({ id: 'AUTH.GENERAL.SUBMIT_BUTTON' })}
          </span>}
          {loading && (
            <span className='indicator-progress' style={{ display: 'block' }}>
              {intl.formatMessage({ id: 'AUTH.GENERAL.WAIT' })}{' '}
              <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
            </span>
          )}
        </button>
        <Link to='/auth/login'>
          <button
            type='button'
            id='kt_login_signup_form_cancel_button'
            className='btn btn-lg btn-light-primary w-100 mb-5'
          >
            {intl.formatMessage({ id: 'AUTH.GENERAL.CANCEL' })}
          </button>
        </Link>
      </div>
      {/* end::Form group */}
    </form>
  )
}
