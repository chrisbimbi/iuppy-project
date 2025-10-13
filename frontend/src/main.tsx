// src/main.tsx
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
import {ensureFirebaseAuth} from './lib/firebase'

// >>> Firebase (Push)
import {initPush} from './app/core/push/fcm'
// <<< Firebase (Push)

setupAxios(axios)
Chart.register(...registerables)

const queryClient = new QueryClient()

async function bootstrap() {
  // 1) Registra o Service Worker do FCM (precisa estar ativo antes do getToken)
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js?ver=2', {scope: '/'})
      await navigator.serviceWorker.ready
      if (import.meta.env.DEV) {
        console.info('[SW] firebase-messaging-sw.js registrado e pronto')
      }
    } catch (e) {
      console.warn('[SW] falha ao registrar o service worker do FCM', e)
    }
  }

  // 2) Garante auth anônima do Firebase antes de qualquer acesso ao Storage
  try {
    await ensureFirebaseAuth()
  } catch (e) {
    console.warn('[Firebase] ensureFirebaseAuth falhou (seguindo mesmo assim)', e)
  }

  // 3) Inicializa Push (permissão, token, registra no backend, listeners foreground)
  try {
    const res = await initPush()
    if (import.meta.env.DEV) {
      console.info('[FCM] initPush →', res)
    }
  } catch (e) {
    console.warn('[FCM] initPush falhou', e)
  }

  // 4) Render do app
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