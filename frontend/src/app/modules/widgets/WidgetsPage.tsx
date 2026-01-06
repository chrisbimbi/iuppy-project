import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { PageLink, PageTitle } from '../../..//layout/core'
import { Charts } from './components/Charts'
import { Feeds } from './components/Feeds'
import { Lists } from './components/Lists'
import { Tables } from './components/Tables'
import { Mixed } from './components/Mixed'
import { Statistics } from './components/Statistics'
import { useIntl } from 'react-intl'

const WidgetsPage = () => {
  const intl = useIntl()

  const widgetsBreadCrumbs: Array<PageLink> = [
    {
      title: intl.formatMessage({ id: 'MENU.WIDGETS', defaultMessage: 'Widgets' }),
      path: '/crafted/widgets/charts',
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
          path='charts'
          element={
            <>
              <PageTitle breadcrumbs={widgetsBreadCrumbs}>{intl.formatMessage({ id: 'WIDGETS.CHARTS', defaultMessage: 'Charts' })}</PageTitle>
              <Charts />
            </>
          }
        />
        <Route
          path='feeds'
          element={
            <>
              <PageTitle breadcrumbs={widgetsBreadCrumbs}>{intl.formatMessage({ id: 'WIDGETS.FEEDS', defaultMessage: 'Feeds' })}</PageTitle>
              <Feeds />
            </>
          }
        />
        <Route
          path='lists'
          element={
            <>
              <PageTitle breadcrumbs={widgetsBreadCrumbs}>{intl.formatMessage({ id: 'WIDGETS.LISTS', defaultMessage: 'Lists' })}</PageTitle>
              <Lists />
            </>
          }
        />
        <Route
          path='mixed'
          element={
            <>
              <PageTitle breadcrumbs={widgetsBreadCrumbs}>{intl.formatMessage({ id: 'WIDGETS.MIXED', defaultMessage: 'Mixed' })}</PageTitle>
              <Mixed />
            </>
          }
        />
        <Route
          path='tables'
          element={
            <>
              <PageTitle breadcrumbs={widgetsBreadCrumbs}>{intl.formatMessage({ id: 'WIDGETS.TABLES', defaultMessage: 'Tables' })}</PageTitle>
              <Tables />
            </>
          }
        />
        <Route
          path='statistics'
          element={
            <>
              <PageTitle breadcrumbs={widgetsBreadCrumbs}>{intl.formatMessage({ id: 'WIDGETS.STATISTICS', defaultMessage: 'Statistics' })}</PageTitle>
              <Statistics />
            </>
          }
        />
        <Route index element={<Navigate to='/crafted/widgets/lists' />} />
      </Route>
    </Routes>
  )
}

export default WidgetsPage
