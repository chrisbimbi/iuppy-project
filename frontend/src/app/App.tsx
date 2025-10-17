import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { I18nProvider } from '..//i18n/i18nProvider'
import { LayoutProvider, LayoutSplashScreen } from '..//layout/core'
import { MasterInit } from '..//layout/MasterInit'
import { AuthInit } from './modules/auth'
import { ThemeModeProvider } from '..//partials'
import 'react-quill/dist/quill.snow.css';

// providers
import { CompanyModulesProvider } from './modules/company/providers/CompanyModulesProvider'
import { AccessProvider } from './modules/company/providers/AccessProvider'

const App = () => {
  return (
    <Suspense fallback={<LayoutSplashScreen />}>
      <I18nProvider>
        <LayoutProvider>
          <ThemeModeProvider>
            <AuthInit>
              <CompanyModulesProvider>
                <AccessProvider>
                  <Outlet />
                  <MasterInit />
                </AccessProvider>
              </CompanyModulesProvider>
            </AuthInit>
          </ThemeModeProvider>
        </LayoutProvider>
      </I18nProvider>
    </Suspense>
  )
}

export { App }