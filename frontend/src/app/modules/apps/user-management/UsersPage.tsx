import { Route, Routes, Outlet, Navigate } from 'react-router-dom'
import { PageLink, PageTitle } from '../../../..//layout/core'
import { UsersListWrapper } from './users-list/UsersList'
import { useIntl } from 'react-intl'

const UsersPage = () => {
  const intl = useIntl()
  const usersBreadcrumbs: Array<PageLink> = [
    {
      title: intl.formatMessage({ id: 'USER_MANAGEMENT.BREADCRUMBS.TITLE' }),
      path: '/apps/user-management/users',
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
      <Route element={<Outlet />}>
        <Route
          path='users'
          element={
            <>
              <PageTitle breadcrumbs={usersBreadcrumbs}>
                {intl.formatMessage({ id: 'USER_MANAGEMENT.BREADCRUMBS.USERS_LIST' })}
              </PageTitle>
              <UsersListWrapper />
            </>
          }
        />
      </Route>
      <Route index element={<Navigate to='/apps/user-management/users' />} />
    </Routes>
  )
}

export default UsersPage
