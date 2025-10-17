import { Route, Routes, Navigate } from 'react-router-dom'
import { Registration } from './components/Registration'
import { ForgotPassword } from './components/ForgotPassword'
import { Login } from './components/Login'
import { AuthLayout } from './AuthLayout'

const AuthPage = () => (
  <Routes>
    <Route element={<AuthLayout />}>
      <Route path="login" element={<Login />} />
      <Route path="registration" element={<Registration />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      {/* /auth → login */}
      <Route index element={<Navigate to="login" replace />} />
      {/* Qualquer rota desconhecida em /auth → login */}
      <Route path="*" element={<Navigate to="login" replace />} />
    </Route>
  </Routes>
)

export { AuthPage }