// frontend/src/app/routes/PrivateRoutes.tsx
import { FC, lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import TopBarProgress from 'react-topbar-progress-indicator';
import { DashboardWrapper } from '../pages/dashboard/DashboardWrapper';
import { MenuTestPage } from '../pages/MenuTestPage';
import { getCSSVariableValue } from '../../assets/ts/_utils';
import { WithChildren } from '../../helpers';
import BuilderPageWrapper from '../pages/layout-builder/BuilderPageWrapper';
import ContentPage from 'src/app/modules/communication/controllers/ContentPage';

const PrivateRoutes: FC = () => {
  const ProfilePage = lazy(() => import('../modules/profile/ProfilePage'));
  const WizardsPage = lazy(() => import('../modules/wizards/WizardsPage'));
  const AccountPage = lazy(() => import('../modules/accounts/AccountPage'));
  const WidgetsPage = lazy(() => import('../modules/widgets/WidgetsPage'));
  const ChatPage = lazy(() => import('../modules/apps/chat/ChatPage'));
  const UsersPage = lazy(() => import('../modules/apps/user-management/UsersPage'));

  return (
    <Routes>
      <Route index element={<Navigate to='/dashboard' />} />
      <Route path='dashboard' element={<DashboardWrapper />} />
      <Route path='builder' element={<BuilderPageWrapper />} />
      <Route path='menu-test' element={<MenuTestPage />} />

      {/* Conteúdos (agora tudo gerenciado pelo modal em ContentPage) */}
      <Route path='contents' element={<ContentPage />} />

      {/* Lazy Modules */}
      <Route
        path='crafted/pages/profile/*'
        element={
          <SuspensedView>
            <ProfilePage />
          </SuspensedView>
        }
      />
      <Route
        path='crafted/pages/wizards/*'
        element={
          <SuspensedView>
            <WizardsPage />
          </SuspensedView>
        }
      />
      <Route
        path='crafted/widgets/*'
        element={
          <SuspensedView>
            <WidgetsPage />
          </SuspensedView>
        }
      />
      <Route
        path='crafted/account/*'
        element={
          <SuspensedView>
            <AccountPage />
          </SuspensedView>
        }
      />
      <Route
        path='apps/chat/*'
        element={
          <SuspensedView>
            <ChatPage />
          </SuspensedView>
        }
      />
      <Route
        path='apps/user-management/*'
        element={
          <SuspensedView>
            <UsersPage />
          </SuspensedView>
        }
      />

      {/* Page Not Found */}
      <Route path='*' element={<Navigate to='/error/404' />} />
    </Routes>
  );
};

const SuspensedView: FC<WithChildren> = ({ children }) => {
  const baseColor = getCSSVariableValue('--bs-primary');
  TopBarProgress.config({
    barColors: { '0': baseColor },
    barThickness: 1,
    shadowBlur: 5,
  });
  return <Suspense fallback={<TopBarProgress />}>{children}</Suspense>;
};

export { PrivateRoutes };