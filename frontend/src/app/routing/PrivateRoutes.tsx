import { FC, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import TopBarProgress from 'react-topbar-progress-indicator'
import { DashboardWrapper } from '../pages/dashboard/DashboardWrapper'
import { MenuTestPage } from '../pages/MenuTestPage'
import BuilderPageWrapper from '../pages/layout-builder/BuilderPageWrapper'
import ContentPage from 'src/app/modules/communication/controllers/ContentPage'
import GroupsPage from '../modules/groups/controller/GroupsPage'
import ChannelsPage from '../modules/channels/views/ChannelsPage'
import SurveysPage from '../modules/surveys/controllers/SurveysPage'
import SurveyEditPage from '../modules/surveys/controllers/SurveyEditPage'

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

        {/* Grupos */}
        <Route path="groups" element={<GroupsPage />} />

        {/* Canais */}
        <Route path="channels" element={<ChannelsPage />} />

        {/* Surveys (novo caminho) */}
        <Route path="modules/surveys" element={<SurveysPage />} />
        <Route path="/modules/surveys/new" element={<SurveyEditPage />} />
        <Route path="/modules/surveys/:surveyId/edit" element={<SurveyEditPage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/error/404" />} />
      </Routes>
    </Suspense>
  )
}

export { PrivateRoutes }