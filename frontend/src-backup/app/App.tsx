import {Suspense} from 'react'
import {Outlet} from 'react-router-dom'
import {I18nProvider} from '..//i18n/i18nProvider'
import {LayoutProvider, LayoutSplashScreen} from '..//layout/core'
import {MasterInit} from '..//layout/MasterInit'
import {AuthInit} from './modules/auth'
import {ThemeModeProvider} from '..//partials'

const App = () => {
  return (
    <Suspense fallback={<LayoutSplashScreen />}>
      <I18nProvider>
        <LayoutProvider>
          <ThemeModeProvider>
            <AuthInit>
              <Outlet />
              <MasterInit />
            </AuthInit>
          </ThemeModeProvider>
        </LayoutProvider>
      </I18nProvider>
    </Suspense>
  )
}

export {App}
