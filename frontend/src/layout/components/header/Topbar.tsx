import {FC} from 'react'
import clsx from 'clsx'
import {KTIcon, toAbsoluteUrl} from '../../../helpers'
import { HeaderUserMenu, Search } from '../../../partials' // Removidos QuickLinks, ThemeMode, etc
import { useLayout } from '../../core'
import { useCmsNotifications } from 'src/app/modules/forms/hooks/useCmsNotifications'

const itemClass = 'ms-1 ms-lg-3',
  btnClass = 'btn btn-icon btn-active-light-primary w-30px h-30px w-md-40px h-md-40px',
  userAvatarClass = 'symbol-30px symbol-md-40px'

const Topbar: FC = () => {
  const {config} = useLayout()
  
  // 🔥 Hook de Badges
  const { badgeCount } = useCmsNotifications();

  return (
    <div className='d-flex align-items-stretch flex-shrink-0'>
      {/* Search (Mantido) */}
      <div className={clsx('d-flex align-items-stretch', itemClass)}>
        <Search />
      </div>

      {/* Notifications (O único ícone de ação que sobrou) */}
      <div className={clsx('d-flex align-items-center', itemClass)}>
        <div 
          className={clsx(btnClass, 'position-relative')} 
          id='kt_activities_toggle'
        >
          <i className='bi bi-bell fs-2' />
          {badgeCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge badge-circle badge-danger animation-blink h-6px w-6px p-1">
            </span>
          )}
        </div>
      </div>

      {/* User Menu */}
      <div className={clsx('d-flex align-items-center', itemClass)} id='kt_header_user_menu_toggle'>
        <div
          className={clsx('cursor-pointer symbol', userAvatarClass)}
          data-kt-menu-trigger='click'
          data-kt-menu-attach='parent'
          data-kt-menu-placement='bottom-end'
        >
          <img src={toAbsoluteUrl('media/avatars/300-1.jpg')} alt='user' />
        </div>
        <HeaderUserMenu />
      </div>
      
       {/* Mobile Toggler */}
       {config.header.left === 'menu' && (
        <div className='d-flex align-items-center d-lg-none ms-2' title='Show header menu'>
          <div className='btn btn-icon btn-active-color-primary w-30px h-30px w-md-40px h-md-40px' id='kt_header_menu_mobile_toggle'>
            <KTIcon iconName='text-align-left' className='fs-1' />
          </div>
        </div>
      )}
    </div>
  )
}

export {Topbar}