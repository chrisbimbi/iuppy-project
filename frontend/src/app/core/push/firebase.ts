// src/app/core/push/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getMessaging, isSupported as isMessagingSupported, Messaging } from 'firebase/messaging'
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics, logEvent } from 'firebase/analytics'

export type FirebaseStuff = {
  app: ReturnType<typeof initializeApp>,
  messaging: Messaging | null,
  analytics: Analytics | null,
}

let singleton: FirebaseStuff | null = null

export async function bootFirebase(): Promise<FirebaseStuff> {
  if (singleton) return singleton

  let app;
  if (getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp({
      apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_APP_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_APP_FIREBASE_MEASUREMENT_ID,
    })
  }

  const [messaging, analytics] = await Promise.all([
    isMessagingSupported().then(ok => ok ? getMessaging(app) : null).catch(() => null),
    isAnalyticsSupported().then(ok => ok ? getAnalytics(app) : null).catch(() => null),
  ])

  // Analytics de teste
  if (analytics) {
    try { logEvent(analytics, 'app_boot', { where: 'admin' }) } catch { }
  }

  singleton = { app, messaging, analytics }
  return singleton
}