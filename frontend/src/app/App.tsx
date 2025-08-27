// src/app/App.tsx
import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { I18nProvider } from '..//i18n/i18nProvider'
import { LayoutProvider, LayoutSplashScreen } from '..//layout/core'
import { MasterInit } from '..//layout/MasterInit'
import { AuthInit } from './modules/auth'
import { ThemeModeProvider } from '..//partials'
import 'react-quill/dist/quill.snow.css'

// ⬇️ Provider de módulos (você disse que já criou)
import { CompanyModulesProvider } from 'src/app/modules/company/providers/CompanyModulesProvider'

const App = () => {
  return (
    <Suspense fallback={<LayoutSplashScreen />}>
      <I18nProvider>
        <LayoutProvider>
          <ThemeModeProvider>
            <AuthInit>
              {/* O provider pode usar useAuth internamente para pegar companyId */}
              <CompanyModulesProvider>
                <Outlet />
                <MasterInit />
              </CompanyModulesProvider>
            </AuthInit>
          </ThemeModeProvider>
        </LayoutProvider>
      </I18nProvider>
    </Suspense>
  )
}

export { App }