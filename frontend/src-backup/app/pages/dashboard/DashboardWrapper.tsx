import React from 'react'
import {useIntl} from 'react-intl'
import {PageTitle} from '../../../layout/core'
import {
  OverviewMetricsWidget,
  EngagementAnalyticsWidget,
  CommunicationImpactWidget,
  DepartmentEngagementWidget,
  RoleBasedEngagementWidget,
  TurnoverAnalysisWidget,
  HiringEfficiencyWidget,
  OnboardingAndSatisfactionWidget,
} from '../../..//partials/widgets'
import {Toolbar} from '../../../layout/components/toolbar/Toolbar'
import {Content} from '../../../layout/components/Content'

const DashboardPage = () => {
  return (
    <>
      <Toolbar />
      <Content>
        <PageTitle breadcrumbs={[]} description='Análise estratégica de RH e Comunicação Interna'>
          Dashboard Estratégico
        </PageTitle>
        
        {/* Visão Geral e Engajamento */}
        <div className='row g-5 g-xl-8 mb-5'>
          <div className='col-xl-4'>
            <OverviewMetricsWidget className='card-xl-stretch mb-xl-8' />
          </div>
          <div className='col-xl-8'>
            <EngagementAnalyticsWidget className='card-xl-stretch mb-xl-8' />
          </div>
        </div>

        {/* Impacto da Comunicação e Análise por Departamento/Cargo */}
        <div className='row g-5 g-xl-8 mb-5'>
          <div className='col-xl-6'>
            <CommunicationImpactWidget className='card-xl-stretch mb-xl-8' />
          </div>
          <div className='col-xl-3'>
            <DepartmentEngagementWidget className='card-xl-stretch mb-xl-8' />
          </div>
          <div className='col-xl-3'>
            <RoleBasedEngagementWidget className='card-xl-stretch mb-xl-8' />
          </div>
        </div>

        {/* Turnover, Eficiência de Contratação e Onboarding/Satisfação */}
        <div className='row g-5 g-xl-8 mb-5'>
          <div className='col-xl-4'>
            <TurnoverAnalysisWidget className='card-xl-stretch mb-xl-8' />
          </div>
          <div className='col-xl-4'>
            <HiringEfficiencyWidget className='card-xl-stretch mb-xl-8' />
          </div>
          <div className='col-xl-4'>
            <OnboardingAndSatisfactionWidget className='card-xl-stretch mb-xl-8' />
          </div>
        </div>
      </Content>
    </>
  )
}

const DashboardWrapper = () => {
  const intl = useIntl()
  return (
    <>
      <PageTitle breadcrumbs={[]}>{intl.formatMessage({id: 'MENU.DASHBOARD'})}</PageTitle>
      <DashboardPage />
    </>
  )
}

export {DashboardWrapper}