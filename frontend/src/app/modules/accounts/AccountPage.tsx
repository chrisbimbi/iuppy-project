import React from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { PageLink, PageTitle } from '../../..//layout/core'
import { Overview } from './components/Overview'
import { Settings } from './components/settings/Settings'
import { AccountHeader } from './AccountHeader'
import { useIntl } from 'react-intl'

const AccountPage: React.FC = () => {
  const intl = useIntl()
  const accountBreadCrumbs: Array<PageLink> = [
    {
      title: intl.formatMessage({ id: 'ACCOUNT.BREADCRUMBS.ACCOUNT' }),
      path: '/crafted/account/overview',
      isSeparator: false,
      isActive: false,
    },
    {
      title: '',
      path: '',
      isSeparator: true,
      isActive: false,
    },
  ]

  return (
    <Routes>
      <Route
        element={
          <>
            <AccountHeader />
            <Outlet />
          </>
        }
      >
        <Route
          path='overview'
          element={
            <>
              <PageTitle breadcrumbs={accountBreadCrumbs}>
                {intl.formatMessage({ id: 'ACCOUNT.OVERVIEW' })}
              </PageTitle>
              <Overview />
            </>
          }
        />
        <Route
          path='settings'
          element={
            <>
              <PageTitle breadcrumbs={accountBreadCrumbs}>
                {intl.formatMessage({ id: 'ACCOUNT.SETTINGS' })}
              </PageTitle>
              <Settings />
            </>
          }
        />
        <Route index element={<Navigate to='/crafted/account/overview' />} />
      </Route>
    </Routes>
  )
}

export default AccountPage
