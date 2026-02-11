import React, { FC } from 'react'
import { useIntl } from 'react-intl'
import { PageTitle } from '../../../layout/core'
import { DashboardStats } from './DashboardStats'

const DashboardWrapper: FC = () => {
  const intl = useIntl()
  return (
    <>
      <PageTitle breadcrumbs={[]}>{intl.formatMessage({ id: 'MENU.DASHBOARD' })}</PageTitle>
      <DashboardStats />
    </>
  )
}

export { DashboardWrapper }