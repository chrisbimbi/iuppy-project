import { FC } from 'react'
import { Link } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../..//helpers'

const Error403: FC = () => {
    return (
        <>
            {/* begin::Title */}
            <h1 className='fw-bolder fs-2hx text-gray-900 mb-4'>Acesso negado</h1>
            {/* end::Title */}

            {/* begin::Text */}
            <div className='fw-semibold fs-6 text-gray-500 mb-7'>
                Este módulo não está habilitado para sua empresa.
            </div>
            {/* end::Text */}

            {/* begin::Illustration (usa a mesma ideia dos outros, imagem opcional) */}
            <div className='mb-3'>
                <img
                    src={toAbsoluteUrl('../media/auth/lock-dark.png')}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    className='mw-100 mh-300px theme-dark-show'
                    alt=''
                />
                <img
                    src={toAbsoluteUrl('../media/auth/lock.png')}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    className='mw-100 mh-300px theme-light-show'
                    alt=''
                />
            </div>
            {/* end::Illustration */}

            {/* begin::Link */}
            <div className='mb-0 d-flex gap-2 justify-content-center'>
                <Link to='/dashboard' className='btn btn-sm btn-light'>Voltar</Link>
                <Link to='/company/settings' className='btn btn-sm btn-primary'>Configurações da Empresa</Link>
            </div>
            {/* end::Link */}
        </>
    )
}

export { Error403 }