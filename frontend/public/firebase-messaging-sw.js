/* public/firebase-messaging-sw.js */

// Usar compat para simplificar no SW
importScripts('https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyCokCBhWPWVljeKb08eW41B6c3V0IwRFDY',
  authDomain: 'iuppy-app.firebaseapp.com',
  projectId: 'iuppy-app',
  storageBucket: 'iuppy-app.firebasestorage.app',
  messagingSenderId: '643342034012',
  appId: '1:643342034012:web:9358575a2c3206e3d9f299',
  measurementId: 'G-LWPWD15CV0',
})

const messaging = firebase.messaging()

// Mensagens "data" em background
messaging.onBackgroundMessage(async (payload) => {
  // Estrutura esperada do payload (data)
  // {
  //   title, body, image, icon, tag, newsId, click_action, sentAt
  // }
  const data = payload?.data || {}
  const title = data.title || 'Iuppy'
  const body = data.body || ''
  const image = data.image || undefined
  const icon = data.icon || '/favicon.ico'
  const tag = data.tag || (data.newsId ? `news:${data.newsId}` : 'news')
  // Deep link: usa o click_action quando vier, senão monta via env(s)
  const url = data.click_action
    || `${self.origin}${(self.registration.scope || '').endsWith('/') ? '' : '/'}#/contents/${data.newsId || ''}?src=push`

  const options = {
    body,
    icon,
    image,
    tag,
    data: {
      url,
      newsId: data.newsId || null,
      sentAt: data.sentAt || null,
      _raw: data,
    },
  }

  await self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification?.data?.url || self.origin
  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true })
      const client = allClients.find(c => c.url.includes(self.origin))
      if (client) {
        client.focus()
        client.postMessage({ type: 'PUSH_CLICK', data: event.notification?.data || {} })
        client.navigate(url)
      } else {
        await clients.openWindow(url)
      }
    })()
  )
})