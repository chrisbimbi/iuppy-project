import React, { useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useLocation } from 'react-router';
import { useAuth } from 'src/app/modules/auth';
import { useSpaces } from 'src/app/modules/spaces/hooks/useSpaces';
import { DrawerComponent, ToggleComponent } from 'src/assets/ts/components';
import { AsideMenuItemWithSub } from './AsideMenuItemWithSub';
import { AsideMenuItem } from './AsideMenuItem';
import { useCompanyModulesCtx } from 'src/app/modules/company/providers/CompanyModulesProvider';

// ⬇️ novo: checar módulos habilitados

export function AsideMenuMain() {
  const intl = useIntl();
  const { pathname } = useLocation();
  const { currentUser } = useAuth();
  const companyId = currentUser?.companyId ?? '';

  const { data: spaces = [], loading } = useSpaces(companyId);

  const isContents = pathname.startsWith('/contents');
  const isSurveys = pathname.startsWith('/modules/surveys');

  const t = (id: string, defaultMsg: string) => {
    try {
      return intl.formatMessage({ id, defaultMessage: defaultMsg });
    } catch {
      return defaultMsg;
    }
  };

  useEffect(() => {
    setTimeout(() => {
      DrawerComponent.reinitialization();
      ToggleComponent.reinitialization();
    }, 50);
  }, [pathname]);

  // ⬇️ módulos habilitados
  const { loading: modsLoading, isEnabled } = useCompanyModulesCtx();

  // só consideramos como “módulos” os que não são canais/grupos/spaces
  const hasAnyRealModuleEnabled = useMemo(() => {
    if (modsLoading) return true; // evita flicker de sumir/voltar
    // hoje: só SURVEYS; no futuro: forms, onboarding, etc.
    return isEnabled('surveys');
  }, [modsLoading, isEnabled]);

  return (
    <>
      {/* Dashboard */}
      <AsideMenuItem to="/dashboard" title={t('MENU.DASHBOARD', 'Dashboard')} fontIcon="bi-speedometer2" />

      {/* Conteúdos (sempre) */}
      <AsideMenuItem to="/contents" title={t('MENU.CONTENTS', 'Conteúdos')} fontIcon="bi-newspaper" />

      {/* Sub-itens de Conteúdos (apenas quando estiver em /contents) */}
      {isContents && (
        <>
          <AsideMenuItemWithSub to="/contents" title={t('MENU.SEGMENTATION', 'Segmentação')} fontIcon="bi-diagram-3">
            {loading ? (
              <AsideMenuItem to="" hasBullet title={t('MENU.LOADING', 'Carregando...')} />
            ) : (
              spaces.map(space => (
                <AsideMenuItem key={space.id} to={`/contents?spaceId=${space.id}`} hasBullet title={space.name} />
              ))
            )}
          </AsideMenuItemWithSub>

        </>
      )}

      {/* Módulos (SEMPRE MOSTRAR o grupo) */}
      <AsideMenuItemWithSub to="/modules" title={t('MENU.MODULES', 'Módulos')} fontIcon="bi-stack">
        {/* Subitens condicionais */}
        {!modsLoading && isEnabled('surveys') && (
          <AsideMenuItem
            to="/modules/surveys"
            hasBullet
            fontIcon="bi-bar-chart"
            title={t('MENU.SURVEYS', 'Pesquisas e Enquetes')}
          />
        )}
      </AsideMenuItemWithSub>

      {/* Segmentação dentro de /modules/surveys */}
      {isSurveys && !modsLoading && isEnabled('surveys') && (
        <AsideMenuItemWithSub to="/modules/surveys" title={t('MENU.SEGMENTATION', 'Segmentação')} fontIcon="bi-diagram-3">
          {loading ? (
            <AsideMenuItem to="" hasBullet title={t('MENU.LOADING', 'Carregando...')} />
          ) : (
            spaces.map(space => (
              <AsideMenuItem key={space.id} to={`/modules/surveys?spaceId=${space.id}`} hasBullet title={space.name} />
            ))
          )}
        </AsideMenuItemWithSub>
      )}
      <AsideMenuItem to="/channels" title={t('MENU.CHANNELS', 'Canais')} fontIcon="bi-chat-left-text" />

      {/* Usuários & Grupos */}
      <AsideMenuItemWithSub to="#" title={t('MENU.USERS_GROUPS', 'Meus usuários e grupos')} fontIcon="bi-people">
        <AsideMenuItem to="/groups" hasBullet title={t('MENU.GROUPS', 'Grupos')} />
        <AsideMenuItem to="/users" hasBullet title={t('MENU.USERS', 'Usuários')} />
      </AsideMenuItemWithSub>
    </>
  )
}