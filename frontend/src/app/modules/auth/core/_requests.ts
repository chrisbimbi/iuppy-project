// src/app/modules/auth/core/_requests.ts
import axios, { AxiosError, AxiosInstance } from 'axios'
import { AuthModel, UserModel } from './_models'
import * as authHelper from './AuthHelpers'

// ✅ Alinha com a porta real do backend (3000 por padrão)
const API_BASE = (import.meta.env.VITE_APP_API_URL || 'http://localhost:3000').replace(/\/$/, '')
const AUTH_BASE = `${API_BASE}/auth`

/** Client geral (usa Authorization: Bearer ...) */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ← garante envio/recebimento de cookies quando necessário
})

/** Interceptor p/ anexar Authorization em TODAS as requisições do client geral */
api.interceptors.request.use((config) => {
  const auth = authHelper.getAuth()
  if (auth?.api_token) {
    config.headers = config.headers || {}
      ; (config.headers as any).Authorization = `Bearer ${auth.api_token}`
  }
  return config
})

/** Controle de concorrência p/ refresh */
let refreshing: Promise<string> | null = null

/** ✅ Refresh via COOKIE httpOnly (modelo B). Nada de body. */
async function doRefresh(): Promise<string> {
  // precisa de withCredentials: true para o cookie 'rt' ir no request
  const { data } = await axios.post(`${AUTH_BASE}/refresh`, null, { withCredentials: true })
  const newAccess = data?.accessToken as string | undefined
  if (!newAccess) throw new Error('REFRESH_WITHOUT_ACCESS_TOKEN')

  // Só persistimos o access token; o refresh fica no cookie httpOnly
  authHelper.setAuth({ api_token: newAccess })
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

/** ✅ LOGIN — precisa aceitar Set-Cookie do refresh → withCredentials: true */
export async function login(email: string, password: string) {
  const { data } = await axios.post(
    `${AUTH_BASE}/login`,
    { email, password },
    { withCredentials: true } // ← recebe o cookie 'rt' httpOnly
  )
  const accessToken = data?.accessToken as string | undefined
  if (!accessToken) throw new Error('LOGIN_WITHOUT_ACCESS_TOKEN')

  const auth: AuthModel = { api_token: accessToken }
  return { data: auth }
}

/** Busca o usuário autenticado (usa o client `api` com Bearer + refresh automático) */
export async function getUserByToken(_token: string) {
  const { data } = await api.get('/auth/me')
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
    // se o backend invalidar o cookie no /logout melhor ainda (clearCookie)
    await axios.post(`${AUTH_BASE}/logout`, null, { withCredentials: true })
  } catch {
    // ignore
  } finally {
    authHelper.removeAuth()
  }
}

export function register(email: string, firstname: string, lastname: string, password: string, password_confirmation: string) {
  return axios.post(`${AUTH_BASE}/register`, {
    email,
    firstname,
    lastname,
    password,
    password_confirmation,
  })
}