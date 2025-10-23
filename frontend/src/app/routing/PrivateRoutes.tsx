import { FC, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import TopBarProgress from 'react-topbar-progress-indicator'

import { DashboardWrapper } from '../pages/dashboard/DashboardWrapper'
import { MenuTestPage } from '../pages/MenuTestPage'
import BuilderPageWrapper from '../pages/layout-builder/BuilderPageWrapper'

import NewsStatsPage from 'src/app/modules/communication/views/NewsStatsPage'
import NewsCommentsPage from 'src/app/modules/communication/views/NewsCommentsPage'
import GroupsPage from '../modules/groups/controller/GroupsPage'
import ChannelsPage from '../modules/channels/controllers/ChannelsPage'

import SurveysPage from '../modules/surveys/controllers/SurveysPage'
import SurveyEditPage from '../modules/surveys/controllers/SurveyEditPage'
import SurveyResultsPage from '../modules/surveys/views/results/SurveyResultsPage'

// Company
import CompanySettingsPage from 'src/app/modules/company/controllers/CompanySettingsPage'

// Guard de módulos
import { RequireModule } from 'src/app/components/RequireModule'
import ModulesLanding from '../pages/ModulesLanding'

// 🔥 Nova visão geral de conteúdos
import ContentsOverviewPage from 'src/app/modules/analytics/views/ContentsOverviewPage'
import ContentPage from '../modules/communication/controllers/ContentPage'

const PrivateRoutes: FC = () => {
  return (
    <Suspense fallback={<TopBarProgress />}>
      <Routes>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardWrapper />} />
        <Route path="builder" element={<BuilderPageWrapper />} />
        <Route path="menu-test" element={<MenuTestPage />} />

        {/* Conteúdos */}
        <Route path="contents" element={<ContentPage />} />
        <Route path="contents/:newsId/stats" element={<NewsStatsPage />} />
        <Route path="contents/:newsId/comments" element={<NewsCommentsPage />} />

        {/* Analytics – visão geral de conteúdos */}
        <Route path="analytics/contents" element={<ContentsOverviewPage />} />

        {/* Grupos */}
        <Route path="groups" element={<GroupsPage />} />

        {/* Canais */}
        <Route path="channels" element={<ChannelsPage />} />

        {/* Surveys (protegidas pelo módulo 'surveys') */}
        <Route path="modules" element={<ModulesLanding />} />
        <Route
          path="modules/surveys"
          element={
            <RequireModule moduleKey="surveys">
              <SurveysPage />
            </RequireModule>
          }
        />
        <Route
          path="modules/surveys/new"
          element={
            <RequireModule moduleKey="surveys">
              <SurveyEditPage />
            </RequireModule>
          }
        />
        <Route
          path="modules/surveys/:surveyId/edit"
          element={
            <RequireModule moduleKey="surveys">
              <SurveyEditPage />
            </RequireModule>
          }
        />
        <Route
          path="surveys/:surveyId/results"
          element={
            <RequireModule moduleKey="surveys">
              <SurveyResultsPage />
            </RequireModule>
          }
        />
        <Route
          path="modules/surveys/:surveyId/results"
          element={
            <RequireModule moduleKey="surveys">
              <SurveyResultsPage />
            </RequireModule>
          }
        />

        {/* Company Settings */}
        <Route path="company/settings" element={<CompanySettingsPage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/error/404" />} />
      </Routes>
    </Suspense>
  )
}

export { PrivateRoutes }