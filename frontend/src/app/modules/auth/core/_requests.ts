import axios, { AxiosError, AxiosInstance } from 'axios'
import { AuthModel, UserModel } from './_models'
import * as authHelper from './AuthHelpers'

const API_BASE = (import.meta.env.VITE_APP_API_URL || 'http://localhost:4000').replace(/\/$/, '')
const AUTH_BASE = `${API_BASE}/auth`

/** Client exclusivo para rotas /auth (usa cookie httpOnly 'rt' no refresh) */
export const http = axios.create({
  baseURL: AUTH_BASE,
  withCredentials: true, // necessário pro cookie 'rt' no /auth/refresh
})

/** Client "geral" da API (tudo que precisa do access token) */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // mantém consistência, e permite enviar cookies se houver
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

/** Refresh-on-401 (apenas 1 retry) — funciona para `api` e também para `http` */
let refreshing: Promise<string> | null = null
async function doRefresh(): Promise<string> {
  const res = await http.post('/refresh')
  const newToken = res.data?.accessToken as string
  if (!newToken) throw new Error('refresh sem accessToken')
  authHelper.setAuth({ api_token: newToken })
  return newToken
}

function attachRefreshInterceptor(client: AxiosInstance) {
  client.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      const cfg: any = error.config || {}
      const status = error.response?.status

      // só tenta 1x
      if (status === 401 && !cfg.__isRetry) {
        try {
          if (!refreshing) refreshing = doRefresh().finally(() => (refreshing = null))
          const newToken = await refreshing
          cfg.headers = cfg.headers || {}
          cfg.headers.Authorization = `Bearer ${newToken}`
          cfg.__isRetry = true
          return client.request(cfg)
        } catch {
          // refresh falhou → logout lógico
          authHelper.removeAuth()
        }
      }
      return Promise.reject(error)
    }
  )
}

// ✅ APLICA o refresh-on-401 nos DOIS clients
attachRefreshInterceptor(api)
attachRefreshInterceptor(http)

/** Login: cria cookie httpOnly 'rt' no backend e retorna accessToken no body */
export async function login(email: string, password: string) {
  const res = await http.post('/login', { email, password })
  const accessToken: string = res.data?.accessToken
  if (!accessToken) throw new Error('Login sem accessToken')
  const auth: AuthModel = { api_token: accessToken }
  authHelper.setAuth(auth)
  return { data: auth }
}

/** Busca o usuário autenticado usando o access token (Authorization: Bearer ...) */
export async function getUserByToken(_token: string) {
  // usa o client `api` (com Authorization + refresh)
  const res = await api.get('/auth/me')
  const raw = res.data as any
  const mapped = { ...raw, id: raw.id ?? raw.sub }
  return { data: mapped as UserModel }
}

export async function refreshAccessToken(): Promise<string> {
  const res = await http.post('/refresh')
  const token = res.data?.accessToken as string
  if (!token) throw new Error('Refresh sem accessToken')
  authHelper.setAuth({ api_token: token })
  return token
}

export async function logout() {
  try {
    await http.post('/logout') // limpa cookie 'rt' no backend
  } finally {
    authHelper.removeAuth()
  }
}