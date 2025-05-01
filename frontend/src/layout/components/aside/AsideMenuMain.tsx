// frontend/src/layout/components/AsideMenuMain.tsx
import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useLocation } from 'react-router';
import { useAuth } from 'src/app/modules/auth';
import { useSpaces } from 'src/app/modules/spaces/hooks/useSpaces';
import { DrawerComponent, ToggleComponent } from 'src/assets/ts/components';
import { AsideMenuItemWithSub } from './AsideMenuItemWithSub';
import { AsideMenuItem } from './AsideMenuItem';

export function AsideMenuMain() {
  const intl = useIntl();
  const { pathname } = useLocation();
  const { currentUser } = useAuth();
  const companyId = currentUser?.companyId ?? '';

  // espaços só para segmento
  const { data: spaces = [], loading } = useSpaces(companyId);

  const isContents = pathname.startsWith('/contents');

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

  return (
    <>
      {/* --- Dashboard --- */}
      <AsideMenuItem
        to="/dashboard"
        title={t('MENU.DASHBOARD', 'Dashboard')}
        fontIcon="bi-speedometer2"
      />

      {/* --- Conteúdos (link direto) --- */}
      <AsideMenuItem
        to="/contents"
        title={t('MENU.CONTENTS', 'Conteúdos')}
        fontIcon="bi-newspaper"
      />

      {/* --- Sub-menus de Conteúdos (só em /contents) --- */}
      {isContents && (
        <>
          <AsideMenuItemWithSub
            to="/contents"
            title={t('MENU.SEGMENTATION', 'Segmentação')}
            fontIcon="bi-diagram-3"
          >
            {loading ? (
              <AsideMenuItem
                to=""
                hasBullet
                title={t('MENU.LOADING', 'Carregando...')}
              />
            ) : (
              spaces.map(space => (
                <AsideMenuItem
                  key={space.id}
                  to={`/contents?spaceId=${space.id}`}
                  hasBullet
                  title={space.name}
                />
              ))
            )}
          </AsideMenuItemWithSub>

          <AsideMenuItemWithSub
            to="/contents/modules"
            title={t('MENU.MODULES', 'Módulos')}
            fontIcon="bi-stack"
          >
            {[
              { to: '/contents/pages', icon: 'bi-journal-text', label: t('MENU.PAGES','Pages') },
              { to: '/contents/surveys', icon: 'bi-bar-chart',   label: t('MENU.SURVEYS','Surveys') },
            ].map(mod => (
              <AsideMenuItem
                key={mod.to}
                to={mod.to}
                hasBullet
                fontIcon={mod.icon}
                title={mod.label}
              />
            ))}
          </AsideMenuItemWithSub>
        </>
      )}

      {/* --- Usuários & Grupos (sempre visível) --- */}
      <AsideMenuItemWithSub
        to="#"
        title={t('MENU.USERS_GROUPS', 'Meus usuários e grupos')}
        fontIcon="bi-people"
      >
        <AsideMenuItem
          to="/groups"
          hasBullet
          title={t('MENU.GROUPS', 'Grupos')}
        />
        <AsideMenuItem
          to="/users"
          hasBullet
          title={t('MENU.USERS', 'Usuários')}
        />
      </AsideMenuItemWithSub>
    </>
  );
}