
import { Route, Routes, Outlet, Navigate } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { PageLink, PageTitle } from '../../../layout/core'
import { JourneyList } from './components/JourneyList'
import { JourneyBuilder } from './components/JourneyBuilder'
import { JourneyAnalytics } from './components/JourneyAnalytics'
import JourneyStepStatsPage from './components/JourneyStepStatsPage'
import { ModuleConfig } from './components/ModuleConfig'

const JourneysPage = () => {
    const intl = useIntl()
    const journeysBreadcrumbs: PageLink[] = [
        {
            title: intl.formatMessage({ id: 'JOURNEYS.BREADCRUMBS.TITLE' }),
            path: '/journeys',
            isActive: false,
            isSeparator: false,
        },
        {
            title: '',
            path: '',
            isActive: false,
            isSeparator: true,
        },
    ]

    return (
        <Routes>
            <Route element={<Outlet />}>
                <Route
                    path='list'
                    element={
                        <>
                            <PageTitle breadcrumbs={journeysBreadcrumbs}>{intl.formatMessage({ id: 'JOURNEYS.PAGE.TITLE.ALL' })}</PageTitle>
                            <JourneyList />
                        </>
                    }
                />
                <Route
                    path='builder'
                    element={
                        <>
                            <PageTitle breadcrumbs={journeysBreadcrumbs}>{intl.formatMessage({ id: 'JOURNEYS.PAGE.TITLE.CREATE' })}</PageTitle>
                            <JourneyBuilder />
                        </>
                    }
                />
                <Route
                    path='builder/:id'
                    element={
                        <>
                            <PageTitle breadcrumbs={journeysBreadcrumbs}>{intl.formatMessage({ id: 'JOURNEYS.PAGE.TITLE.EDIT' })}</PageTitle>
                            <JourneyBuilder />
                        </>
                    }
                />
                <Route
                    path=':id/analytics'
                    element={
                        <>
                            <PageTitle breadcrumbs={journeysBreadcrumbs}>Analytics</PageTitle>
                            <JourneyAnalytics />
                        </>
                    }
                />
                <Route
                    path=':journeyId/steps/:stepId/stats'
                    element={
                        <>
                            <PageTitle breadcrumbs={journeysBreadcrumbs}>Step Statistics</PageTitle>
                            <JourneyStepStatsPage />
                        </>
                    }
                />
                <Route
                    path='config'
                    element={
                        <>
                            <PageTitle breadcrumbs={journeysBreadcrumbs}>{intl.formatMessage({ id: 'JOURNEYS.PAGE.TITLE.CONFIG' })}</PageTitle>
                            <ModuleConfig />
                        </>
                    }
                />
                <Route index element={<Navigate to='/journeys/list' />} />
            </Route>
        </Routes>
    )
}

export default JourneysPage
