import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import * as authHelper from '../app/modules/auth/core/AuthHelpers'
import { refreshAccessToken } from '../app/modules/auth/core/_requests'
import { getAuth } from '../app/modules/auth/core/AuthHelpers'


export const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, ''),
    withCredentials: true, // ok manter; não atrapalha o Bearer
})


// injeta o Bearer em cada request
api.interceptors.request.use((config) => {
    const auth = getAuth()
    if (auth?.api_token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${auth.api_token}`;
    }
    return config
})

// tenta 1x o refresh em 401 e repete a request original
let isRefreshing = false
let pendingQueue: Array<() => void> = []

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const original = error.config as any
        const status = error.response?.status

        if (status === 401 && !original?._retry) {
            original._retry = true

            if (isRefreshing) {
                await new Promise<void>((resolve) => pendingQueue.push(resolve))
            } else {
                try {
                    isRefreshing = true
                    const newAccess = await refreshAccessToken() // POST /auth/refresh (cookie)
                    if (!newAccess) throw new Error('No access token from refresh')
                    authHelper.setAuth({ api_token: newAccess })
                    pendingQueue.forEach((fn) => fn())
                    pendingQueue = []
                } catch (e) {
                    authHelper.removeAuth()
                    pendingQueue = []
                    throw e
                } finally {
                    isRefreshing = false
                }
            }
            // reenvia a original com o novo token
            const auth = authHelper.getAuth()
            original.headers = original.headers || {}
            original.headers.Authorization = auth?.api_token ? `Bearer ${auth.api_token}` : ''
            return api(original)
        }

        return Promise.reject(error)
    },
)