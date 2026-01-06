import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { PageLink, PageTitle } from '../../..//layout/core'
import { Vertical } from './components/Vertical'
import { Horizontal } from './components/Horizontal'
import { useIntl } from 'react-intl'

const WizardsPage = () => {
  const intl = useIntl()

  const wizardsBreadCrumbs: Array<PageLink> = [
    {
      title: intl.formatMessage({ id: 'MENU.WIZARDS', defaultMessage: 'Wizards' }),
      path: '/crafted/pages/wizards/horizontal',
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
          path='horizontal'
          element={
            <>
              <PageTitle breadcrumbs={wizardsBreadCrumbs}>{intl.formatMessage({ id: 'WIZARDS.HORIZONTAL', defaultMessage: 'Horizontal' })}</PageTitle>
              <Horizontal />
            </>
          }
        />
        <Route
          path='vertical'
          element={
            <>
              <PageTitle breadcrumbs={wizardsBreadCrumbs}>{intl.formatMessage({ id: 'WIZARDS.VERTICAL', defaultMessage: 'Vertical' })}</PageTitle>
              <Vertical />
            </>
          }
        />
        <Route index element={<Navigate to='/crafted/pages/wizards/horizontal' />} />
      </Route>
    </Routes>
  )
}

export default WizardsPage
