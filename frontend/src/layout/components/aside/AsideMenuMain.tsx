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
    if (modsLoading || aclLoading) return true
    return isOrgAdmin || (isEnabled('news') && canView('news'))
  }, [modsLoading, aclLoading, isOrgAdmin, isEnabled, canView])

  const showChannels = useMemo(() => {
    if (modsLoading || aclLoading) return true
    return isOrgAdmin || (isEnabled('channels') && canView('channels'))
  }, [modsLoading, aclLoading, isOrgAdmin, isEnabled, canView])

  const showSurveys = useMemo(() => {
    if (modsLoading || aclLoading) return true
    return isOrgAdmin || (isEnabled('surveys') && canView('surveys'))
  }, [modsLoading, aclLoading, isOrgAdmin, isEnabled, canView])

  const showGroups = useMemo(() => {
    if (modsLoading || aclLoading) return true
    return isOrgAdmin || (isEnabled('groups') && canView('groups'))
  }, [modsLoading, aclLoading, isOrgAdmin, isEnabled, canView])

  // 🔥 FORMS
  const showForms = useMemo(() => {
    if (modsLoading || aclLoading) return true
    return isOrgAdmin || (isEnabled('forms') && canView('forms'))
  }, [modsLoading, aclLoading, isOrgAdmin, isEnabled, canView])

  return (
    <>
      {/* Dashboard */}
      <AsideMenuItem to="/dashboard" title={t('MENU.DASHBOARD', 'Dashboard')} fontIcon="bi-speedometer2" />

      {/* Módulos */}
      <AsideMenuItemWithSub to="/modules" title={t('MENU.MODULES', 'Módulos')} fontIcon="bi-stack">
        {showContents && (
          <AsideMenuItem to="/contents" hasBullet fontIcon="bi-newspaper" title={t('MENU.CONTENTS', 'Conteúdos')} />
        )}
        {showSurveys && (
          <AsideMenuItem to="/modules/surveys" hasBullet fontIcon="bi-bar-chart" title={t('MENU.SURVEYS', 'Pesquisas e Enquetes')} />
        )}
        {showForms && (
          <AsideMenuItem
            to="/forms"                 // ✅ vai para a LISTA
            hasBullet
            fontIcon="bi-ui-checks-grid"
            title={t('MENU.FORMS', 'Formulários')}
          />
        )}
      </AsideMenuItemWithSub>

      {showChannels && (
        <AsideMenuItem to="/channels" fontIcon="bi-chat-left-text" title={t('MENU.CHANNELS', 'Canais')} />
      )}

      {/* Usuários & Grupos */}
      <AsideMenuItemWithSub to="#" title={t('MENU.USERS_GROUPS', 'Meus usuários e grupos')} fontIcon="bi-people">
        {showGroups && <AsideMenuItem to="/groups" hasBullet title={t('MENU.GROUPS', 'Grupos')} />}
      </AsideMenuItemWithSub>
    </>
  )
}