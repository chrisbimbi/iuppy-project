// src/lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET, // iuppy-app.firebasestorage.app
  appId: import.meta.env.VITE_APP_FIREBASE_APP_ID,
}

// Sanidade: evita “appspot.com” ou typos tipo “iiuppy…”
if (
  !firebaseConfig.storageBucket ||
  firebaseConfig.storageBucket.includes('appspot.com') ||
  !firebaseConfig.storageBucket.endsWith('.firebasestorage.app') ||
  firebaseConfig.storageBucket.startsWith('ii') // 👈 pega o teu caso
) {
  console.error('[firebase] storageBucket inválido:', firebaseConfig.storageBucket)
  throw new Error('VITE_APP_FIREBASE_STORAGE_BUCKET inválido. Use iuppy-app.firebasestorage.app')
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Força o bucket correto
const bucketUrl = `gs://${firebaseConfig.storageBucket}`
export const storage = getStorage(app, bucketUrl)

export async function ensureFirebaseAuth(): Promise<void> {
  if (auth.currentUser) return
  await new Promise<void>((resolve, reject) => {
    const off = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) await signInAnonymously(auth)
        resolve()
      } catch (e) {
        reject(e)
      } finally {
        off()
      }
    })
  })
  if (!auth.currentUser) await signInAnonymously(auth)
}

console.log('[firebase] storageBucket:', firebaseConfig.storageBucket)