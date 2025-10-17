import { FC } from 'react'
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom'
import { PrivateRoutes } from './PrivateRoutes'
import { ErrorsPage } from '../modules/errors/ErrorsPage'
import ForbiddenPage from 'src/app/pages/ForbiddenPage'
import { Logout, AuthPage, useAuth } from '../modules/auth'
import { App } from '../App'
import { MasterLayout } from '../../layout/MasterLayout'
import { CMSGuard } from './CMSGuard'

const { BASE_URL } = import.meta.env

const AppRoutes: FC = () => {
  const { currentUser } = useAuth()

  return (
    <BrowserRouter basename={BASE_URL}>
      <Routes>
        <Route element={<App />}>
          {/* Auth SEM guarda – sempre disponível */}
          <Route path="auth/*" element={<AuthPage />} />

          {/* Auxiliares */}
          <Route path="logout" element={<Logout />} />
          <Route path="error/*" element={<ErrorsPage />} />
          <Route path="forbidden" element={<ForbiddenPage />} />

          {currentUser ? (
            <Route
              element={
                <CMSGuard>
                  <MasterLayout />
                </CMSGuard>
              }
            >
              <Route path="/*" element={<PrivateRoutes />} />
              <Route index element={<Navigate to="/dashboard" replace />} />
            </Route>
          ) : (
            // Sem login → manda para /auth/login
            <Route path="*" element={<Navigate to="/auth/login" replace />} />
          )}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export { AppRoutes }