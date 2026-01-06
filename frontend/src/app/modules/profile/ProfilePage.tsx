import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { PageLink, PageTitle } from '../../..//layout/core'
import { Overview } from './components/Overview'
import { Projects } from './components/Projects'
import { Campaigns } from './components/Campaigns'
import { Documents } from './components/Documents'
import { Connections } from './components/Connections'
import { ProfileHeader } from './ProfileHeader'

const ProfilePage = () => {
  const intl = useIntl()
  const profileBreadCrumbs: Array<PageLink> = [
    {
      title: intl.formatMessage({ id: 'PROFILE.BREADCRUMBS.PROFILE', defaultMessage: 'Profile' }),
      path: '/crafted/pages/profile/overview',
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
            <ProfileHeader />
            <Outlet />
          </>
        }
      >
        <Route
          path='overview'
          element={
            <>
              <PageTitle breadcrumbs={profileBreadCrumbs}>{intl.formatMessage({ id: 'PROFILE.TABS.OVERVIEW', defaultMessage: 'Overview' })}</PageTitle>
              <Overview />
            </>
          }
        />
        <Route
          path='projects'
          element={
            <>
              <PageTitle breadcrumbs={profileBreadCrumbs}>{intl.formatMessage({ id: 'PROFILE.TABS.PROJECTS', defaultMessage: 'Projects' })}</PageTitle>
              <Projects />
            </>
          }
        />
        <Route
          path='campaigns'
          element={
            <>
              <PageTitle breadcrumbs={profileBreadCrumbs}>{intl.formatMessage({ id: 'PROFILE.TABS.CAMPAIGNS', defaultMessage: 'Campaigns' })}</PageTitle>
              <Campaigns />
            </>
          }
        />
        <Route
          path='documents'
          element={
            <>
              <PageTitle breadcrumbs={profileBreadCrumbs}>{intl.formatMessage({ id: 'PROFILE.TABS.DOCUMENTS', defaultMessage: 'Documents' })}</PageTitle>
              <Documents />
            </>
          }
        />
        <Route
          path='connections'
          element={
            <>
              <PageTitle breadcrumbs={profileBreadCrumbs}>{intl.formatMessage({ id: 'PROFILE.TABS.CONNECTIONS', defaultMessage: 'Connections' })}</PageTitle>
              <Connections />
            </>
          }
        />
        <Route index element={<Navigate to='/crafted/pages/profile/overview' />} />
      </Route>
    </Routes>
  )
}

export default ProfilePage
