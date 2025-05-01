import { FC, lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import TopBarProgress from 'react-topbar-progress-indicator'
import { DashboardWrapper } from '../pages/dashboard/DashboardWrapper'
import { MenuTestPage } from '../pages/MenuTestPage'
import { getCSSVariableValue } from '../../assets/ts/_utils'
import { WithChildren } from '../../helpers'
import BuilderPageWrapper from '../pages/layout-builder/BuilderPageWrapper'
import ContentPage from 'src/app/modules/communication/controllers/ContentPage'
import GroupsPage from '../modules/groups/controller/GroupsPage'



const PrivateRoutes: FC = () => {
  // ...
  return (
    <Routes>
      <Route index element={<Navigate to='/dashboard' />} />
      <Route path='dashboard' element={<DashboardWrapper />} />
      <Route path='builder' element={<BuilderPageWrapper />} />
      <Route path='menu-test' element={<MenuTestPage />} />

      {/* Conteúdos */}
      <Route path='contents' element={<ContentPage />} />

+     {/* NOVA ROTA: Grupos de usuário */}
+      <Route path='groups' element={<GroupsPage />} />

      {/* Lazy Modules */}
      {/* ... */}
      <Route path='*' element={<Navigate to='/error/404' />} />
    </Routes>
  )
}

// ...
export { PrivateRoutes }