// frontend/src/layout/components/AsideMenuItemWithSub.tsx
import React from 'react'
import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'
import { KTIcon, WithChildren } from '../../../helpers'
import { useLayout } from '../../core'

type Props = {
  to: string
  title: string
  icon?: string
  fontIcon?: string
  hasBullet?: boolean
}

export const AsideMenuItemWithSub: React.FC<Props & WithChildren> = ({
  children, to, title, icon, fontIcon, hasBullet
}) => {
  const { pathname } = useLocation()
  const isActive = pathname.startsWith(to)
  const { config } = useLayout()
  const { aside } = config

  return (
    <div
      className={clsx('menu-item', 'menu-accordion', isActive && 'here show')}
      data-kt-menu-trigger='click'
      data-kt-menu-placement='right-start'
    >
      <span className='menu-link'>
        {icon && aside.menuIcon==='svg' && <KTIcon iconName={icon} className='fs-2' />}
        {fontIcon && aside.menuIcon==='font' && <i className={`bi ${fontIcon} fs-2`}></i>}
        <span className='menu-title'>{title}</span>
        <span className='menu-arrow'></span>
      </span>
      <div className={clsx('menu-sub menu-sub-accordion', isActive && 'menu-active-bg')}>
        {children}
      </div>
    </div>
  )
}