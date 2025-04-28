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
  const isContents = pathname.startsWith('/contents');

  const { currentUser } = useAuth();
  const companyId = currentUser?.companyId ?? '';
  const { data: spaces = [], loading } = useSpaces(companyId);

  const t = (id: string, defaultMsg: string) => {
    try {
      return intl.formatMessage({ id, defaultMessage: defaultMsg });
    } catch {
      return defaultMsg;
    }
  };

  const modules = [
    { id: 'NEWS',    to: '/contents/news',    icon: 'bi-file-earmark-text', label: t('MENU.NEWS','News') },
    { id: 'PAGES',   to: '/contents/pages',   icon: 'bi-journal-text',      label: t('MENU.PAGES','Pages') },
    { id: 'SURVEYS', to: '/contents/surveys', icon: 'bi-bar-chart',         label: t('MENU.SURVEYS','Surveys') },
  ];

  // sempre re-inicializa o drawer/accordion do Metronic
  useEffect(() => {
    // @ts-ignore
    window.setTimeout(() => {
      // esses métodos estão no bundle TS do Metronic
      // reinitialization garante que o accordion funcione após mudança de rota
      DrawerComponent.reinitialization();
      ToggleComponent.reinitialization();
    }, 50);
  }, [pathname]);

  if (!isContents) return null;

  return (
    <>
      {/* --- Segmentação --- */}
      <AsideMenuItemWithSub
        to="/contents/news"
        title={t('MENU.SEGMENTATION','Segmentação')}
        fontIcon="bi-diagram-3"
      >
        {loading ? (
          <AsideMenuItem title={t('MENU.LOADING', 'Carregando...')} to={''} />
        ) : (
          spaces.map(space => (
            <AsideMenuItem
              key={space.id}
              to={`/contents/news?spaceId=${space.id}`}
              title={space.name}
              hasBullet
            />
          ))
        )}
      </AsideMenuItemWithSub>

      {/* --- Módulos --- */}
      <AsideMenuItemWithSub
        to="/contents/modules"
        title={t('MENU.MODULES','Módulos')}
        fontIcon="bi-stack"
      >
        {modules.map(mod => (
          <AsideMenuItem
            key={mod.id}
            to={mod.to}
            title={mod.label}
            fontIcon={mod.icon}
          />
        ))}
      </AsideMenuItemWithSub>
    </>
  );
}
