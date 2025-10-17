// src/lib/firebase/app.ts
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET, // <= iuppy-app.appspot.com
    appId: import.meta.env.VITE_APP_FIREBASE_APP_ID,
}

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const storage = getStorage(app)

/**
 * Faz login anônimo só pra liberar o Storage no browser.
 * (Ative "Anonymous" no Firebase Console > Authentication > Sign-in method.)
 */
export async function ensureFirebaseAuth() {
    try {
        if (!auth.currentUser) {
            await signInAnonymously(auth)
        }
    } catch (e) {
        console.warn('Firebase anonymous sign-in failed:', e)
    }
}