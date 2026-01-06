// src/app/routing/PrivateRoutes.tsx

import React, { FC, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import TopBarProgress from 'react-topbar-progress-indicator'

import { DashboardWrapper } from '../pages/dashboard/DashboardWrapper'
import { MenuTestPage } from '../pages/MenuTestPage'
import BuilderPageWrapper from '../pages/layout-builder/BuilderPageWrapper'

import NewsStatsPage from 'src/app/modules/communication/views/NewsStatsPage'
import NewsCommentsPage from 'src/app/modules/communication/views/NewsCommentsPage'
import CampaignsPage from '../modules/communication/views/CampaignsPage'
import GroupsPage from '../modules/groups/controller/GroupsPage'
import { UsersPage } from '../modules/users/controllers/UsersPage'
import ChannelsPage from '../modules/channels/controllers/ChannelsPage'

import SurveysPage from '../modules/surveys/controllers/SurveysPage'
import SurveyEditPage from '../modules/surveys/controllers/SurveyEditPage'
import SurveyResultsPage from '../modules/surveys/views/results/SurveyResultsPage'

// Company
import CompanySettingsPage from 'src/app/modules/company/controllers/CompanySettingsPage'

// Guard de módulos
import { RequireModule } from 'src/app/components/RequireModule'
import ModulesLanding from '../pages/ModulesLanding'

// Analytics de conteúdos
import ContentsOverviewPage from 'src/app/modules/analytics/views/ContentsOverviewPage'
import ContentPage from '../modules/communication/controllers/ContentPage'

// 🔥 FORMS
import FormsListPage from '../modules/forms/controllers/FormsListPage'
import FormEditPage from '../modules/forms/controllers/FormEditPage'
import FormSubmissionsPage from '../modules/forms/controllers/FormSubmissionsPage'
import FormStatsPage from '../modules/forms/controllers/FormStatsPage'
// 🔥 CORREÇÃO: Importação com caminho relativo
import FormsDashboardPage from '../modules/forms/controllers/FormsDashboardPage'
import JourneysPage from '../modules/journeys/JourneysPage'
import { SocialAnalyticsPage } from '../modules/social/SocialAnalyticsPage'
import Nr1ParticipationHub from '../modules/nr1/views/ParticipationHub'
import RiskInventoryPage from '../modules/nr1/views/risk-inventory/RiskInventoryPage'
import ActionPlansPage from '../modules/nr1/views/action-plans/ActionPlansPage'
import EmergencyPage from '../modules/nr1/views/emergency/EmergencyPage'
import TrainingsPage from '../modules/nr1/views/trainings/TrainingsPage'
import AuditExportPage from '../modules/nr1/views/audit/AuditExportPage'
import EsocialQueuePage from '../modules/nr1/views/esocial/EsocialQueuePage'
import AnalyticsPage from '../modules/nr1/views/analytics/AnalyticsPage'

// 🔥 MODULES
import VacationDashboard from '../modules/vacations/views/VacationDashboard'
import VacationRequestsPage from '../modules/vacations/views/VacationRequestsPage'
import { VacationPolicyConfig } from '../modules/vacations/views/VacationPolicyConfig'
import { MyVacationsPage } from '../modules/vacations/views/MyVacationsPage'
import PerformanceDashboard from '../modules/performance/views/PerformanceDashboard'
import { OneOnOnePage } from '../modules/performance/views/OneOnOnePage'
import { MyPDIPage } from '../modules/performance/views/MyPDIPage'
import { CompanyGoals } from '../modules/performance/views/CompanyGoals'
import IntegrationsWorkspace from '../modules/integrations/IntegrationsWorkspace'

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



        {/* Social Analytics */}
        <Route
          path="social-analytics"
          element={
            <RequireModule moduleKey="social">
              <SocialAnalyticsPage />
            </RequireModule>
          }
        />

        {/* Vacations */}
        <Route
          path="vacations/policy"
          element={
            <RequireModule moduleKey="vacations">
              <VacationPolicyConfig />
            </RequireModule>
          }
        />
        <Route
          path="vacations/requests"
          element={
            <RequireModule moduleKey="vacations">
              <VacationRequestsPage />
            </RequireModule>
          }
        />
        <Route
          path="vacations"
          element={
            <RequireModule moduleKey="vacations">
              <VacationDashboard />
            </RequireModule>
          }
        />
        <Route
          path="vacations/my-vacations"
          element={
            <RequireModule moduleKey="vacations">
              <MyVacationsPage />
            </RequireModule>
          }
        />

        {/* Performance */}
        <Route
          path="performance"
          element={
            <RequireModule moduleKey="performance">
              <PerformanceDashboard />
            </RequireModule>
          }
        />
        <Route
          path="performance/1on1"
          element={
            <RequireModule moduleKey="performance">
              <OneOnOnePage />
            </RequireModule>
          }
        />
        <Route
          path="performance/my-pdi"
          element={
            <RequireModule moduleKey="performance">
              <MyPDIPage />
            </RequireModule>
          }
        />
        <Route
          path="performance/goals"
          element={
            <RequireModule moduleKey="performance">
              <CompanyGoals />
            </RequireModule>
          }
        />

        {/* Integrations Workspace */}
        <Route
          path="integrations"
          element={
            <IntegrationsWorkspace />
          }
        />

        {/* 🔥 NOVO: Analytics – visão geral de FORMS */}
        <Route
          path="forms/dashboard"
          element={
            <RequireModule moduleKey="forms">
              <FormsDashboardPage />
            </RequireModule>
          }
        />

        {/* Usuários */}
        <Route path="users" element={<UsersPage />} />

        {/* Grupos */}
        <Route path="groups" element={<GroupsPage />} />

        {/* Canais */}
        <Route path="channels" element={<ChannelsPage />} />

        {/* 🔥 NR-1 */}
        <Route
          path="modules/nr1/participation"
          element={
            <RequireModule moduleKey="nr1">
              {/* Lazy load helps, but direct import is fine for now if we import it */}
              <React.Suspense fallback={<TopBarProgress />}>
                <Nr1ParticipationHub />
              </React.Suspense>
            </RequireModule>
          }
        />

        <Route
          path="modules/nr1/risks"
          element={
            <RequireModule moduleKey="nr1">
              <React.Suspense fallback={<TopBarProgress />}>
                <RiskInventoryPage />
              </React.Suspense>
            </RequireModule>
          }
        />

        <Route
          path="modules/nr1/actions"
          element={
            <RequireModule moduleKey="nr1">
              <React.Suspense fallback={<TopBarProgress />}>
                <ActionPlansPage />
              </React.Suspense>
            </RequireModule>
          }
        />

        <Route
          path="modules/nr1/emergency"
          element={
            <RequireModule moduleKey="nr1">
              <React.Suspense fallback={<TopBarProgress />}>
                <EmergencyPage />
              </React.Suspense>
            </RequireModule>
          }
        />

        <Route
          path="modules/nr1/trainings"
          element={
            <RequireModule moduleKey="nr1">
              <React.Suspense fallback={<TopBarProgress />}>
                <TrainingsPage />
              </React.Suspense>
            </RequireModule>
          }
        />

        <Route
          path="modules/nr1/audit"
          element={
            <RequireModule moduleKey="nr1">
              <React.Suspense fallback={<TopBarProgress />}>
                <AuditExportPage />
              </React.Suspense>
            </RequireModule>
          }
        />

        <Route
          path="modules/nr1/esocial"
          element={
            <RequireModule moduleKey="nr1">
              <React.Suspense fallback={<TopBarProgress />}>
                <EsocialQueuePage />
              </React.Suspense>
            </RequireModule>
          }
        />

        <Route
          path="modules/nr1/analytics"
          element={
            <RequireModule moduleKey="nr1">
              <React.Suspense fallback={<TopBarProgress />}>
                <AnalyticsPage />
              </React.Suspense>
            </RequireModule>
          }
        />

        {/* Surveys */}
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

        {/* FORMS — lista */}
        <Route
          path="forms"
          element={
            <RequireModule moduleKey="forms">
              <FormsListPage />
            </RequireModule>
          }
        />
        {/* FORMS — criar */}
        <Route
          path="forms/new"
          element={
            <RequireModule moduleKey="forms">
              <FormEditPage />
            </RequireModule>
          }
        />
        {/* FORMS — editar */}
        <Route
          path="forms/:formId/edit"
          element={
            <RequireModule moduleKey="forms">
              <FormEditPage />
            </RequireModule>
          }
        />
        {/* FORMS — submissões (inbox) */}
        <Route
          path="forms/:formId/submissions"
          element={
            <RequireModule moduleKey="forms">
              <FormSubmissionsPage />
            </RequireModule>
          }
        />
        {/* FORMS — estatísticas (deep-dive) */}
        <Route
          path="forms/:formId/stats"
          element={
            <RequireModule moduleKey="forms">
              <FormStatsPage />
            </RequireModule>
          }
        />

        {/* Journeys */}
        <Route
          path="journeys/*"
          element={
            <RequireModule moduleKey="journeys">
              <JourneysPage />
            </RequireModule>
          }
        />

        {/* Aliases sob /modules (opcional) */}
        <Route
          path="modules/forms"
          element={
            <RequireModule moduleKey="forms">
              <FormsListPage />
            </RequireModule>
          }
        />
        <Route
          path="modules/forms/new"
          element={
            <RequireModule moduleKey="forms">
              <FormEditPage />
            </RequireModule>
          }
        />
        <Route
          path="modules/forms/:formId/edit"
          element={
            <RequireModule moduleKey="forms">
              <FormEditPage />
            </RequireModule>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/error/404" />} />
      </Routes>
    </Suspense>
  )
}

export { PrivateRoutes }