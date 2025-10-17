// src/app/modules/auth/components/Login.tsx
import { useState } from 'react'
import * as Yup from 'yup'
import clsx from 'clsx'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import { useIntl } from 'react-intl'
import { getUserByToken, login, logout } from '../core/_requests'
import { toAbsoluteUrl } from '../../../..//helpers'
import { useAuth } from '../core/Auth'
import { Role } from '@shared/types'

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('AUTH.VALIDATION.INVALID_EMAIL')
    .min(3, 'AUTH.VALIDATION.MIN_LENGTH')
    .max(50, 'AUTH.VALIDATION.MAX_LENGTH')
    .required('AUTH.VALIDATION.REQUIRED'),
  password: Yup.string()
    .min(3, 'AUTH.VALIDATION.MIN_LENGTH')
    .max(50, 'AUTH.VALIDATION.MAX_LENGTH')
    .required('AUTH.VALIDATION.REQUIRED'),
})

/** Credenciais seed:
 *  super_admin+000c0911@iuppy.com.br / P@ssw0rd!
 */
const initialValues = { email: '', password: '' }

/** Perfis que podem acessar o CMS */
const ALLOWED_CMS_ROLES: Array<Role | string> = [
  'super_admin',
  'company_admin',
  'content_admin',
  'hr_admin',
]

export function Login() {
  const [loading, setLoading] = useState(false)
  const { saveAuth, setCurrentUser } = useAuth()
  const intl = useIntl()
  const navigate = useNavigate()
  const location = useLocation()

  const formik = useFormik({
    initialValues,
    validationSchema: loginSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true)
      try {
        // 1) Login → recebe accessToken + refreshToken
        const { data: auth } = await login(values.email, values.password)

        // 2) Persiste tokens
        saveAuth(auth)

        // 3) Busca usuário autenticado com o access token
        const { data: user } = await getUserByToken(auth.api_token)
        const role = (user as any)?.role as Role | string

        // 4) Bloqueio de perfis não-admin no CMS
        if (!ALLOWED_CMS_ROLES.includes(role)) {
          try { await logout() } catch { }
          saveAuth(undefined)
          setCurrentUser(undefined)
          setStatus('Seu perfil não tem acesso ao painel administrativo.')
          setSubmitting(false)
          return
        }

        // 5) OK → segue para o destino
        setCurrentUser(user)
        const qs = new URLSearchParams(location.search)
        const to = qs.get('to') || '/dashboard'
        navigate(to, { replace: true })
      } catch (error) {
        console.error(error)
        saveAuth(undefined)
        setCurrentUser(undefined)
        setStatus(intl.formatMessage({ id: 'AUTH.VALIDATION.INVALID_LOGIN' }))
        setSubmitting(false)
      } finally {
        setLoading(false)
      }
    },
  })

  return (
    <form
      className='form w-100'
      onSubmit={formik.handleSubmit}
      noValidate
      id='kt_login_signin_form'
    >
      <div className='text-center mb-11'>
        <h1 className='text-gray-900 fw-bolder mb-3'>
          {intl.formatMessage({ id: 'AUTH.LOGIN.TITLE' })}
        </h1>
        <div className='text-gray-500 fw-semibold fs-6'>
          {intl.formatMessage({ id: 'AUTH.LOGIN.DESCRIPTION' })}
        </div>
      </div>

      <div className='row g-3 mb-9'>
        <div className='col-md-6'>
          <a
            href='#'
            className='btn btn-flex btn-outline btn-text-gray-700 btn-active-color-primary bg-state-light flex-center text-nowrap w-100'
          >
            <img
              alt='Logo'
              src={toAbsoluteUrl('../media/svg/brand-logos/google-icon.svg')}
              className='h-15px me-3'
            />
            <span className='d-flex flex-column align-items-start ms-2'>
              <span className='fs-6 fw-bolder'>
                {intl.formatMessage({ id: 'AUTH.LOGIN.BUTTON.GOOGLE' })}
              </span>
            </span>
          </a>
        </div>
        <div className='col-md-6'>
          <a
            href='#'
            className='btn btn-flex btn-outline btn-text-gray-700 btn-active-color-primary bg-state-light flex-center text-nowrap w-100'
          >
            <img
              alt='Logo'
              src={toAbsoluteUrl('../media/svg/brand-logos/microsoft-5.svg')}
              className='h-15px me-3'
            />
            <span className='d-flex flex-column align-items-start ms-2'>
              <span className='fs-6 fw-bolder'>
                {intl.formatMessage({ id: 'AUTH.LOGIN.BUTTON.MICROSOFT' })}
              </span>
            </span>
          </a>
        </div>
      </div>

      <div className='separator separator-content my-14'>
        <span className='w-125px text-gray-500 fw-semibold fs-7'>
          {intl.formatMessage({ id: 'AUTH.LOGIN.CONTINUE_WITH_EMAIL' })}
        </span>
      </div>

      <div className='fv-row mb-8'>
        <label className='form-label fs-6 fw-bolder text-gray-900'>
          {intl.formatMessage({ id: 'AUTH.INPUT.EMAIL' })}
        </label>
        <input
          placeholder={intl.formatMessage({ id: 'AUTH.INPUT.EMAIL' })}
          {...formik.getFieldProps('email')}
          className={clsx(
            'form-control bg-transparent',
            { 'is-invalid': formik.touched.email && formik.errors.email },
            { 'is-valid': formik.touched.email && !formik.errors.email }
          )}
          type='email'
          name='email'
          autoComplete='off'
        />
        {formik.touched.email && formik.errors.email && (
          <div className='fv-plugins-message-container'>
            <span role='alert'>
              {intl.formatMessage({ id: formik.errors.email })}
            </span>
          </div>
        )}
      </div>

      <div className='fv-row mb-3'>
        <label className='form-label fw-bolder text-gray-900 fs-6 mb-0'>
          {intl.formatMessage({ id: 'AUTH.INPUT.PASSWORD' })}
        </label>
        <input
          type='password'
          autoComplete='off'
          {...formik.getFieldProps('password')}
          className={clsx(
            'form-control bg-transparent',
            { 'is-invalid': formik.touched.password && formik.errors.password },
            { 'is-valid': formik.touched.password && !formik.errors.password }
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

      <div className='d-flex flex-stack flex-wrap gap-3 fs-base fw-semibold mb-8'>
        <div />
        <Link to='/auth/forgot-password' className='link-primary'>
          {intl.formatMessage({ id: 'AUTH.GENERAL.FORGOT_BUTTON' })}
        </Link>
      </div>

      {formik.status && (
        <div className='alert alert-danger py-2 mb-6'>{formik.status}</div>
      )}

      <div className='d-grid mb-10'>
        <button
          type='submit'
          id='kt_sign_in_submit'
          className='btn btn-primary'
          disabled={formik.isSubmitting || !formik.isValid || loading}
        >
          {!loading && (
            <span className='indicator-label'>
              {intl.formatMessage({ id: 'AUTH.LOGIN.BUTTON' })}
            </span>
          )}
          {loading && (
            <span className='indicator-progress' style={{ display: 'block' }}>
              {intl.formatMessage({ id: 'AUTH.GENERAL.LOADING' })}
              <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
            </span>
          )}
        </button>
      </div>

      <div className='text-gray-500 text-center fw-semibold fs-6'>
        {intl.formatMessage({ id: 'AUTH.GENERAL.NO_ACCOUNT' })}{' '}
        <Link to='/auth/registration' className='link-primary'>
          {intl.formatMessage({ id: 'AUTH.GENERAL.SIGNUP_BUTTON' })}
        </Link>
      </div>
    </form>
  )
}