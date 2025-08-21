import { FC } from 'react'
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom'
import { PrivateRoutes } from './PrivateRoutes'
import { ErrorsPage } from '../modules/errors/ErrorsPage'
import { Logout, AuthPage, useAuth } from '../modules/auth'
import { App } from '../App'
import { MasterLayout } from '../../layout/MasterLayout'

const { BASE_URL } = import.meta.env

const AppRoutes: FC = () => {
  const { currentUser } = useAuth()

  return (
    <BrowserRouter basename={BASE_URL}>
      <Routes>
        <Route element={<App />}>
          {/* Páginas públicas */}
          <Route path="error/*" element={<ErrorsPage />} />
          <Route path="logout" element={<Logout />} />

          {currentUser ? (
            // Área privada com layout do Metronic
            <Route element={<MasterLayout />}>
              {/* Tudo que exige login */}
              <Route path="/*" element={<PrivateRoutes />} />
              {/* default do site "/" → dashboard (em vez de contents) */}
              <Route index element={<Navigate to="/dashboard" />} />
            </Route>
          ) : (
            <>
              <Route path="auth/*" element={<AuthPage />} />
              {/* Visitante vai para /auth */}
              <Route path="*" element={<Navigate to="/auth" />} />
            </>
          )}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export { AppRoutes }