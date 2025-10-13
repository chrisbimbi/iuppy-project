// src/app/core/push/fcm.ts
import type { Messaging } from 'firebase/messaging'
import { getToken, onMessage } from 'firebase/messaging'
import { bootFirebase } from './firebase'

type RegisterBody = {
    token: string
    platform: 'web'
    vapidKey: string
    userAgent?: string
}

const API = import.meta.env.VITE_API_URL
const VAPID = import.meta.env.VITE_APP_FIREBASE_VAPID_KEY

// 1) Pedir permissão de Notificação de forma segura
export async function ensureNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied'
    if (Notification.permission === 'granted') return 'granted'
    if (Notification.permission === 'denied') return 'denied'
    return await Notification.requestPermission()
}

// 2) Obter (ou renovar) o token FCM
export async function getFcmToken(): Promise<string | null> {
    const { messaging } = await bootFirebase()
    if (!messaging) return null
    try {
        const token = await getToken(messaging, { vapidKey: VAPID, serviceWorkerRegistration: await navigator.serviceWorker.ready })
        return token || null
    } catch (e) {
        console.warn('[FCM] getToken failed', e)
        return null
    }
}

// 3) Registrar token no backend (ajusta a rota se for outra)
export async function registerTokenOnBackend(token: string): Promise<boolean> {
    try {
        // exemplo: guarda no /v2/push/tokens
        const res = await fetch(`${API}/v2/push/tokens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // se autentica por cookie
            body: JSON.stringify({
                token,
                platform: 'web',
                vapidKey: VAPID,
                userAgent: navigator.userAgent,
            } as RegisterBody),
        })
        return res.ok
    } catch (e) {
        console.warn('[FCM] registerTokenOnBackend failed', e)
        return false
    }
}

// 4) Listener em foreground (opcional: mostrar toast/notification)
export async function attachForegroundListener(onPayload?: (p: any) => void) {
    const { messaging } = await bootFirebase()
    if (!messaging) return
    onMessage(messaging as Messaging, (payload) => {
        // payload.data.* (title/body podem vir em notification também)
        try {
            const data = payload?.data || {}
            // Exibe notificação do próprio browser mesmo em foreground (se quiser)
            if (Notification.permission === 'granted') {
                const title = data.title || 'Iuppy'
                const body = data.body || ''
                const icon = data.icon || '/favicon.ico'
                const image = data.image
                const n = new Notification(title, { body, icon, image })
                setTimeout(() => n.close(), 5000)
            }
            onPayload?.(payload)
        } catch (e) {
            console.warn('[FCM] onMessage handler error', e)
        }
    })
}

// 5) Boot geral: pedir permissão, token, registrar, listeners
export async function initPush() {
    const perm = await ensureNotificationPermission()
    if (perm !== 'granted') return { ok: false, reason: 'permission' }

    const token = await getFcmToken()
    if (!token) return { ok: false, reason: 'token' }

    const ok = await registerTokenOnBackend(token)
    await attachForegroundListener()

    // listener de mensagens do SW (clique na notificação)
    navigator.serviceWorker.addEventListener('message', (evt: MessageEvent) => {
        const msg = evt.data || {}
        if (msg.type === 'PUSH_CLICK') {
            // Ex.: pode disparar analytics/telemetria
            // console.log('PUSH_CLICK', msg.data)
        }
    })

    return { ok, token }
}