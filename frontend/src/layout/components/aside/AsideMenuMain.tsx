import React, { useEffect, useMemo } from 'react'
import { useIntl } from 'react-intl'
import { useLocation } from 'react-router'
import { DrawerComponent, ToggleComponent } from 'src/assets/ts/components'
import { AsideMenuItemWithSub } from './AsideMenuItemWithSub'
import { AsideMenuItem } from './AsideMenuItem'
import { useCompanyModulesCtx } from 'src/app/modules/company/providers/CompanyModulesProvider'
import { useAccess } from 'src/app/modules/company/providers/AccessProvider'
import { useAuth } from 'src/app/modules/auth'

export function AsideMenuMain() {
  const intl = useIntl()
  const { pathname } = useLocation()
  const { currentUser } = useAuth()
  const role = currentUser?.role
  const isOrgAdmin = role === 'super_admin' || role === 'company_admin'

  const t = (id: string, def: string) => {
    try { return intl.formatMessage({ id, defaultMessage: def }) } catch { return def }
  }

  useEffect(() => {
    setTimeout(() => {
      DrawerComponent.reinitialization()
      ToggleComponent.reinitialization()
    }, 50)
  }, [pathname])

  const { loading: modsLoading, isEnabled } = useCompanyModulesCtx()
  const { loading: aclLoading, canView } = useAccess()

  const showContents = useMemo(() => {
    if (modsLoading || aclLoading) return false
    return isEnabled('news') && (isOrgAdmin || canView('news'))
  }, [modsLoading, aclLoading, isOrgAdmin, isEnabled, canView])

  const showChannels = useMemo(() => {
    if (modsLoading || aclLoading) return false
    return isEnabled('channels') && (isOrgAdmin || canView('channels'))
  }, [modsLoading, aclLoading, isOrgAdmin, isEnabled, canView])

  const showSurveys = useMemo(() => {
    if (modsLoading || aclLoading) return false
    return isEnabled('surveys') && (isOrgAdmin || canView('surveys'))
  }, [modsLoading, aclLoading, isOrgAdmin, isEnabled, canView])

  const showGroups = useMemo(() => {
    if (modsLoading || aclLoading) return false
    return isEnabled('groups') && (isOrgAdmin || canView('groups'))
  }, [modsLoading, aclLoading, isOrgAdmin, isEnabled, canView])

  // 🔥 FORMS
  const showForms = useMemo(() => {
    if (modsLoading || aclLoading) return false
    return isEnabled('forms') && (isOrgAdmin || canView('forms'))
  }, [modsLoading, aclLoading, isOrgAdmin, isEnabled, canView])

  const showJourneys = useMemo(() => {
    if (modsLoading || aclLoading) return false
    return isEnabled('journeys') && (isOrgAdmin || canView('journeys'))
  }, [modsLoading, aclLoading, isOrgAdmin, isEnabled, canView])

  const showSocial = useMemo(() => {
    if (modsLoading || aclLoading) return false
    return isEnabled('social') && (isOrgAdmin || canView('social'))
  }, [modsLoading, aclLoading, isOrgAdmin, isEnabled, canView])

  const showVacations = useMemo(() => {
    if (modsLoading || aclLoading) return false
    return isEnabled('vacations') && (isOrgAdmin || canView('vacations'))
  }, [modsLoading, aclLoading, isOrgAdmin, isEnabled, canView])

  const showPerformance = useMemo(() => {
    if (modsLoading || aclLoading) return false
    return isEnabled('performance') && (isOrgAdmin || canView('performance'))
  }, [modsLoading, aclLoading, isOrgAdmin, isEnabled, canView])

  const showGamification = useMemo(() => {
    if (modsLoading || aclLoading) return false
    return isEnabled('gamification') && (isOrgAdmin || canView('gamification'))
  }, [modsLoading, aclLoading, isOrgAdmin, isEnabled, canView])

  const showNr1 = useMemo(() => {
    if (modsLoading || aclLoading) return false
    return isEnabled('nr1') && (isOrgAdmin || canView('nr1'))
  }, [modsLoading, aclLoading, isOrgAdmin, isEnabled, canView])

  return (
    <>
      {/* Dashboard */}
      <AsideMenuItem to="/dashboard" title={t('MENU.DASHBOARD', 'Dashboard')} fontIcon="bi-speedometer2" />

      {/* Módulos */}
      <AsideMenuItemWithSub
        to="/modules"
        title={t('MENU.MODULES', 'Módulos')}
        fontIcon="bi-stack"
        additionalPaths={[
          '/contents',
          '/forms',
          '/journeys',
          '/social-analytics',
          '/vacations',
          '/performance',
          '/gamification',
          '/channels'
        ]}
      >
        {showContents && (
          <AsideMenuItem to="/contents" hasBullet fontIcon="bi-newspaper" title={t('MENU.CONTENTS', 'Conteúdos')} />
        )}
        {showSurveys && (
          <AsideMenuItem to="/modules/surveys" hasBullet fontIcon="bi-bar-chart" title={t('MENU.SURVEYS', 'Pesquisas e Enquetes')} />
        )}
        {showForms && (
          <AsideMenuItem to="/forms" hasBullet fontIcon="bi-ui-checks-grid" title={t('MENU.FORMS', 'Formulários')} />
        )}
        {showJourneys && (
          <AsideMenuItem to="/journeys" hasBullet fontIcon="bi-signpost-2" title={t('MENU.JOURNEYS', 'Jornadas')} />
        )}
        {showSocial && (
          <AsideMenuItem to="/social-analytics" hasBullet fontIcon="bi-people" title={t('MENU.SOCIAL', 'Mural Social')} />
        )}
        {/* Vacation & Performance restored to Modules */}
        {showVacations && (
          <AsideMenuItem to="/vacations" hasBullet fontIcon="bi-sun" title={t('MENU.VACATIONS', 'Gestão de Férias')} />
        )}
        {showPerformance && (
          <AsideMenuItem to="/performance" hasBullet fontIcon="bi-trophy" title={t('MENU.PERFORMANCE', 'Ciclos de Avaliação')} />
        )}
        {showGamification && (
          <AsideMenuItem to="/gamification" hasBullet fontIcon="bi-controller" title={t('MENU.GAMIFICATION', 'Gamificação')} />
        )}
        {showNr1 && (
          <AsideMenuItemWithSub to="/modules/nr1" title="NR-1 Digital" fontIcon="bi-shield-check" hasBullet>
            <AsideMenuItem to="/modules/nr1/analytics" hasBullet title="Indicadores" />
            <AsideMenuItem to="/modules/nr1/participation" hasBullet title="Participação" />
            <AsideMenuItem to="/modules/nr1/risks" hasBullet title="Riscos (PGR)" />
            <AsideMenuItem to="/modules/nr1/actions" hasBullet title="Planos de Ação" />
            <AsideMenuItem to="/modules/nr1/emergency" hasBullet title="Emergência (PAE)" />
            <AsideMenuItem to="/modules/nr1/trainings" hasBullet title="Treinamentos" />
            <AsideMenuItem to="/modules/nr1/esocial/config" hasBullet title="Configuração eSocial" />
            <AsideMenuItem to="/modules/nr1/esocial" hasBullet title="eSocial (S-2240)" />
          </AsideMenuItemWithSub>
        )}
      </AsideMenuItemWithSub>

      {/* GAMIFICATION - Standalone */}


      {showChannels && (
        <AsideMenuItem to="/channels" fontIcon="bi-chat-left-text" title={t('MENU.CHANNELS', 'Canais')} />
      )}

      {/* SPACES */}
      {(isOrgAdmin) && (
        <AsideMenuItem to="/spaces" fontIcon="bi-grid-3x3-gap" title="Spaces" />
      )}



      {/* Usuários & Grupos */}
      <AsideMenuItemWithSub to="#" title={t('MENU.USERS_GROUPS', 'Usuários e Grupos')} fontIcon="bi-people">
        <AsideMenuItem to="/users" hasBullet title={t('MENU.USERS', 'Usuários')} />
        <AsideMenuItem to="/groups" hasBullet title={t('MENU.GROUPS', 'Grupos')} />
      </AsideMenuItemWithSub>

      {/* Configuration Section - Moved to Bottom */}
      <AsideMenuItemWithSub to="/settings" title={t('MENU.SETTINGS', 'Configurações')} fontIcon="bi-gear">
        <AsideMenuItemWithSub to="/settings/operations" hasBullet title={t('MENU.OPERATIONS', 'Processos Operacionais')}>
          {showVacations && (
            <AsideMenuItem to="/vacations/policy" hasBullet title={t('MENU.VACATION_POLICY', 'Políticas de Férias')} />
          )}
        </AsideMenuItemWithSub>
        <AsideMenuItem to="/company/settings" hasBullet title={t('MENU.COMPANY', 'Empresa')} />
      </AsideMenuItemWithSub>
    </>
  )
}