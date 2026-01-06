import { Navigate, Route, Routes, Outlet } from 'react-router-dom'
import { PageLink, PageTitle } from '../../../..//layout/core'
import { Private } from './components/Private'
import { Group } from './components/Group'
import { Drawer } from './components/Drawer'
import { useIntl } from 'react-intl'

const ChatPage = () => {
  const intl = useIntl()
  const chatBreadCrumbs: Array<PageLink> = [
    {
      title: intl.formatMessage({ id: 'APPS.CHAT.BREADCRUMBS.CHAT' }),
      path: '/apps/chat/private-chat',
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
          path='private-chat'
          element={
            <>
              <PageTitle breadcrumbs={chatBreadCrumbs}>
                {intl.formatMessage({ id: 'APPS.CHAT.BREADCRUMBS.PRIVATE' })}
              </PageTitle>
              <Private />
            </>
          }
        />
        <Route
          path='group-chat'
          element={
            <>
              <PageTitle breadcrumbs={chatBreadCrumbs}>
                {intl.formatMessage({ id: 'APPS.CHAT.BREADCRUMBS.GROUP' })}
              </PageTitle>
              <Group />
            </>
          }
        />
        <Route
          path='drawer-chat'
          element={
            <>
              <PageTitle breadcrumbs={chatBreadCrumbs}>
                {intl.formatMessage({ id: 'APPS.CHAT.BREADCRUMBS.DRAWER' })}
              </PageTitle>
              <Drawer />
            </>
          }
        />
        <Route index element={<Navigate to='/apps/chat/private-chat' />} />
      </Route>
    </Routes>
  )
}

export default ChatPage
