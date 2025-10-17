// src/app/modules/auth/core/_requests.ts
import axios, { AxiosError, AxiosInstance } from 'axios'
import { AuthModel, UserModel } from './_models'
import * as authHelper from './AuthHelpers'

const API_BASE = (import.meta.env.VITE_APP_API_URL || 'http://localhost:4000').replace(/\/$/, '')
const AUTH_BASE = `${API_BASE}/auth`

/** Client geral (usa Authorization: Bearer ...) */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
})

/** Interceptor p/ anexar Authorization em TODAS as requisições do client geral */
api.interceptors.request.use((config) => {
  const auth = authHelper.getAuth()
  if (auth?.api_token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${auth.api_token}`
  }
  return config
})

/** Controle de concorrência p/ refresh */
let refreshing: Promise<string> | null = null

/** Faz refresh enviando o refreshToken NO BODY (modelo A) */
async function doRefresh(): Promise<string> {
  const saved = authHelper.getAuth()
  const currentRt = saved?.refreshToken
  if (!currentRt) throw new Error('NO_REFRESH_TOKEN')

  const { data } = await axios.post(`${AUTH_BASE}/refresh`, { refreshToken: currentRt })
  const newAccess = data?.accessToken as string | undefined
  const newRt = (data?.refreshToken as string | undefined) ?? currentRt
  if (!newAccess) throw new Error('REFRESH_WITHOUT_ACCESS_TOKEN')

  // persiste ambos
  authHelper.setAuth({ api_token: newAccess, refreshToken: newRt })
  return newAccess
}

/** Refresh-on-401 (apenas 1 retry) — aplicado ao client `api` */
api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const cfg: any = error.config || {}
    const status = error.response?.status

    if (status === 401 && !cfg.__isRetry) {
      try {
        if (!refreshing) refreshing = doRefresh().finally(() => (refreshing = null))
        const newToken = await refreshing
        cfg.headers = cfg.headers || {}
        cfg.headers.Authorization = `Bearer ${newToken}`
        cfg.__isRetry = true
        return api.request(cfg)
      } catch {
        // refresh falhou → limpa auth e propaga 401
        authHelper.removeAuth()
      }
    }
    return Promise.reject(error)
  }
)

/** LOGIN — backend deve retornar { accessToken, refreshToken } */
export async function login(email: string, password: string) {
  const { data } = await axios.post(`${AUTH_BASE}/login`, { email, password })
  const accessToken = data?.accessToken as string | undefined
  const refreshToken = data?.refreshToken as string | undefined
  if (!accessToken) throw new Error('LOGIN_WITHOUT_ACCESS_TOKEN')

  const auth: AuthModel = { api_token: accessToken, refreshToken }
  // não forçamos setAuth aqui; quem chama decide (o Login.tsx já usa saveAuth)
  return { data: auth }
}

/** Busca o usuário autenticado (usa o client `api` com Bearer + refresh automático) */
export async function getUserByToken(_token: string) {
  const { data } = await api.get('/auth/me')
  // garante id
  const mapped = { ...data, id: (data as any).id ?? (data as any).sub }
  return { data: mapped as UserModel }
}

/** Faz refresh manual (se precisar explicitamente) */
export async function refreshAccessToken(): Promise<string> {
  return doRefresh()
}

/** Logout — limpa local e (opcional) avisa backend se houver endpoint */
export async function logout() {
  try {
    await axios.post(`${AUTH_BASE}/logout`)
  } catch {
    // ignore
  } finally {
    authHelper.removeAuth()
  }
}