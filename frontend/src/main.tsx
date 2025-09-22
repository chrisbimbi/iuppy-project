// main.tsx
import {createRoot} from 'react-dom/client'
import axios from 'axios'
import {Chart, registerables} from 'chart.js'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'
import {I18nProvider} from '../src/i18n/i18nProvider'
import './/assets/sass/style.react.scss'
import './/assets/fonticon/fonticon.css'
import './/assets/keenicons/duotone/style.css'
import './/assets/keenicons/outline/style.css'
import './/assets/keenicons/solid/style.css'
import 'react-quill/dist/quill.snow.css'
import './/assets/sass/style.scss'
import {AppRoutes} from './app/routing/AppRoutes'
import {AuthProvider, setupAxios} from './app/modules/auth'
import { ensureFirebaseAuth } from './lib/firebase'

// >>> Firebase
// <<< Firebase

setupAxios(axios)
Chart.register(...registerables)

const queryClient = new QueryClient()

async function bootstrap() {
  // Garante auth (anônima) ANTES de qualquer request ao Storage
  await ensureFirebaseAuth()

  const container = document.getElementById('root')
  if (container) {
    createRoot(container).render(
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </I18nProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    )
  }
}

bootstrap()