import axios from 'axios'
import { AuthModel, UserModel } from './_models'

const API_BASE = (import.meta.env.VITE_APP_API_URL || 'http://localhost:4000').replace(/\/$/, '')
const AUTH_BASE = `${API_BASE}/auth`

export const http = axios.create({
  baseURL: AUTH_BASE,
  withCredentials: true,
})

export async function login(email: string, password: string) {
  const res = await http.post('/login', { email, password })
  const accessToken: string = res.data?.accessToken
  if (!accessToken) throw new Error('Login sem accessToken')
  const auth: AuthModel = { api_token: accessToken }
  return { data: auth }
}

export async function getUserByToken(token: string) {
  const res = await http.get('/me', { headers: { Authorization: `Bearer ${token}` } })
  return { data: res.data as UserModel }
}

export async function refreshAccessToken(): Promise<string> {
  const res = await http.post('/refresh')
  return res.data?.accessToken as string
}

export async function logout() {
  await http.post('/logout')
}