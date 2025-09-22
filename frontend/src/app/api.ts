import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { getAuth, setAuth, removeAuth } from './modules/auth/core/AuthHelpers'
import { refreshAccessToken } from './modules/auth/core/_requests'

const BASE =
    (import.meta.env.VITE_APP_API_URL ||
        import.meta.env.VITE_API_URL ||
        'http://localhost:4000') as string

export const api = axios.create({
    baseURL: BASE.replace(/\/$/, ''),
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const auth = getAuth()
    if (auth?.api_token) {
        // garante objeto e “relaxa” o tipo para aceitar a prop:
        config.headers = (config.headers ?? {}) as any
            ; (config.headers as any).Authorization = `Bearer ${auth.api_token}`
    }
    return config
})

let isRefreshing = false
let queue: Array<() => void> = []

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const original = error.config as any
        if (error.response?.status === 401 && !original?._retry) {
            original._retry = true
            try {
                if (isRefreshing) {
                    await new Promise<void>((resolve) => queue.push(resolve))
                } else {
                    isRefreshing = true
                    const newAccess = await refreshAccessToken()
                    if (!newAccess) throw new Error('No access token from refresh')
                    setAuth({ api_token: newAccess })
                    queue.forEach((fn) => fn()); queue = []
                }
                original.headers = (original.headers ?? {}) as any
                original.headers.Authorization = `Bearer ${getAuth()?.api_token || ''}`
                return api(original)
            } catch (e) {
                removeAuth()
                queue = []
                throw e
            } finally {
                isRefreshing = false
            }
        }
        return Promise.reject(error)
    }
)