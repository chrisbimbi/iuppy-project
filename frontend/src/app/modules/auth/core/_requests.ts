import axios from 'axios'
import { AuthModel, UserModel } from './_models'

const API_BASE = (import.meta.env.VITE_APP_API_URL || 'http://localhost:4000').replace(/\/$/, '')
const AUTH_BASE = `${API_BASE}/auth`

// axios instance para auth, com cookies (refresh token httpOnly)
const http = axios.create({
  baseURL: AUTH_BASE,
  withCredentials: true,
})

// Endpoints reais
export const LOGIN_URL = `${AUTH_BASE}/login`
export const ME_URL = `${AUTH_BASE}/me`
export const REFRESH_URL = `${AUTH_BASE}/refresh`
export const LOGOUT_URL = `${AUTH_BASE}/logout`

// Server returns { accessToken } e seta cookie de refresh (httpOnly)
export async function login(email: string, password: string) {
  const res = await http.post('/login', { email, password })
  const accessToken: string = res.data?.accessToken
  if (!accessToken) throw new Error('Login sem accessToken')

  // mapeia para seu AuthModel (api_token)
  const auth: AuthModel = { api_token: accessToken }
  return { data: auth }
}

// Server returns o usuário (claims) quando autorizado com Bearer
export async function getUserByToken(token: string) {
  const res = await http.get('/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return { data: res.data as UserModel }
}

// Opcional: helpers p/ refresh/logout se quiser usar no interceptor global
export async function refreshAccessToken(): Promise<string> {
  const res = await http.post('/refresh') // cookie rt vai junto por withCredentials
  return res.data?.accessToken as string
}

export async function logout() {
  await http.post('/logout')
}