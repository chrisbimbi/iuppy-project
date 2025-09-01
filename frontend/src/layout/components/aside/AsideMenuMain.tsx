// src/layout/components/aside/AsideMenuMain.tsx
import React, { useEffect, useMemo } from 'react'
import { useIntl } from 'react-intl'
import { useLocation } from 'react-router'
import { useAuth } from 'src/app/modules/auth'
import { useSpaces } from 'src/app/modules/spaces/hooks/useSpaces'
import { DrawerComponent, ToggleComponent } from 'src/assets/ts/components'
import { AsideMenuItemWithSub } from './AsideMenuItemWithSub'
import { AsideMenuItem } from './AsideMenuItem'
import { useCompanyModulesCtx } from 'src/app/modules/company/providers/CompanyModulesProvider'
import { useAccessCtx } from 'src/app/modules/company/providers/AccessProvider'
export function AsideMenuMain() {
  const intl = useIntl()
  const { pathname } = useLocation()
  const { currentUser } = useAuth()
  const companyId = currentUser?.companyId ?? ''

  const { data: spaces = [], loading: spacesLoading } = useSpaces(companyId)
  const isContents = pathname.startsWith('/contents')
  const isSurveys = pathname.startsWith('/modules/surveys')
  const { loading: aclLoading, canView } = useAccessCtx()
  const t = (id: string, def: string) => {
    try { return intl.formatMessage({ id, defaultMessage: def }) } catch { return def }
  }

  useEffect(() => {
    setTimeout(() => {
      DrawerComponent.reinitialization()
      ToggleComponent.reinitialization()
    }, 50)
  }, [pathname])

  // módulos habilitados + capacidades
  const { loading: modsLoading, isEnabled } = useCompanyModulesCtx()

  // manter o título "Módulos" SEMPRE visível; esconder só subitens
  const showSurveys = useMemo(() => {
    if (modsLoading) return true // evita flicker
    return isEnabled('surveys') && canView('surveys')
  }, [modsLoading, isEnabled, canView])

  return (
    <>
      {/* Dashboard */}
      <AsideMenuItem
        to="/dashboard"
        title={t('MENU.DASHBOARD', 'Dashboard')}
        fontIcon="bi-speedometer2"
      />

      {/* Conteúdos (sempre visível) */}
      <AsideMenuItem
        to="/contents"
        title={t('MENU.CONTENTS', 'Conteúdos')}
        fontIcon="bi-newspaper"
      />

      {/* Submenus de Conteúdos quando dentro de /contents */}
      {isContents && (
        <>
          <AsideMenuItemWithSub
            to="/contents"
            title={t('MENU.SEGMENTATION', 'Segmentação')}
            fontIcon="bi-diagram-3"
          >
            {spacesLoading ? (
              <AsideMenuItem to="" hasBullet title={t('MENU.LOADING', 'Carregando...')} />
            ) : (
              spaces.map(s => (
                <AsideMenuItem key={s.id} to={`/contents?spaceId=${s.id}`} hasBullet title={s.name} />
              ))
            )}
          </AsideMenuItemWithSub>

          <AsideMenuItem
            to="/channels"
            title={t('MENU.CHANNELS', 'Canais')}
            fontIcon="bi-chat-left-text"
          />
        </>
      )}

      {/* Módulos — título sempre visível; subitens condicionais */}
      <AsideMenuItemWithSub
        to="/modules"
        title={t('MENU.MODULES', 'Módulos')}
        fontIcon="bi-stack"
      >
        {isEnabled('surveys') && (aclLoading || canView('surveys')) && (
          <AsideMenuItem
            to="/modules/surveys"
            hasBullet
            fontIcon="bi-bar-chart"
            title={t('MENU.SURVEYS', 'Pesquisas e Enquetes')}
          />
        )}
      </AsideMenuItemWithSub>

      {/* Segmentação dentro de /modules/surveys (se tiver permissão) */}
      {isSurveys && showSurveys && (
        <AsideMenuItemWithSub
          to="/modules/surveys"
          title={t('MENU.SEGMENTATION', 'Segmentação')}
          fontIcon="bi-diagram-3"
        >
          {spacesLoading ? (
            <AsideMenuItem to="" hasBullet title={t('MENU.LOADING', 'Carregando...')} />
          ) : (
            spaces.map(s => (
              <AsideMenuItem key={s.id} to={`/modules/surveys?spaceId=${s.id}`} hasBullet title={s.name} />
            ))
          )}
        </AsideMenuItemWithSub>
      )}

      {/* Usuários & Grupos */}
      <AsideMenuItemWithSub
        to="#"
        title={t('MENU.USERS_GROUPS', 'Meus usuários e grupos')}
        fontIcon="bi-people"
      >
        <AsideMenuItem to="/groups" hasBullet title={t('MENU.GROUPS', 'Grupos')} />
        <AsideMenuItem to="/users" hasBullet title={t('MENU.USERS', 'Usuários')} />
      </AsideMenuItemWithSub>
    </>
  )
}