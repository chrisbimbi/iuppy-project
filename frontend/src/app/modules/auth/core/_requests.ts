import api, { setAccessToken } from '../../../../services/baseApi'

// Mantém a assinatura esperada pelo AuthContext atual
export type AuthModel = { api_token: string }

export function login(email: string, password: string) {
  return api.post<{ accessToken: string }>('/auth/login', { email, password })
    .then(({ data }) => {
      // mapeia para o formato antigo (api_token)
      setAccessToken(data.accessToken)
      return { data: { api_token: data.accessToken } as AuthModel }
    })
}

export function getUserByToken(_token: string) {
  // backend devolve o payload do JWT em /auth/me (ou ajuste para /users/me se tiver)
  return api.get('/auth/me')
}

export function logout() {
  return api.post('/auth/logout').then(() => setAccessToken(null))
}

// Mantém stubs se o app ainda chama:
export const REGISTER_URL = '/auth/register'
export const REQUEST_PASSWORD_URL = '/auth/forgot-password'
export const GET_USER_BY_ACCESSTOKEN_URL = '/auth/me'
export const LOGIN_URL = '/auth/login'