import React from 'react'
import { MenuItem } from './MenuItem'
import { MenuInnerWithSub } from './MenuInnerWithSub'
import { MegaMenu } from './MegaMenu'
import { useIntl } from 'react-intl'

export function MenuInner() {
  const intl = useIntl()
  return (

    <>
      <MenuItem title={intl.formatMessage({ id: 'MENU.DASHBOARD' })} to='/dashboard' />

      <MenuItem title='Conteúdos' to='/contents' />
      <MenuItem title='Configurações' to='/company/settings' />


    </>
  )
}
