/* eslint-disable @typescript-eslint/no-explicit-any */
import {AuthModel} from './_models'

export const AUTH_LOCAL_STORAGE_KEY = 'kt-auth-react-v'

export const getAuth = (): AuthModel | undefined => {
  if (!localStorage) return
  const lsValue = localStorage.getItem(AUTH_LOCAL_STORAGE_KEY)
  if (!lsValue) return
  try {
    const auth: AuthModel = JSON.parse(lsValue) as AuthModel
    return auth
  } catch (error) {
    console.error('AUTH LOCAL STORAGE PARSE ERROR', error)
  }
}

export const setAuth = (auth: AuthModel) => {
  if (!localStorage) return
  try {
    localStorage.setItem(AUTH_LOCAL_STORAGE_KEY, JSON.stringify(auth))
  } catch (error) {
    console.error('AUTH LOCAL STORAGE SAVE ERROR', error)
  }
}

export const removeAuth = () => {
  if (!localStorage) return
  try {
    localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY)
  } catch (error) {
    console.error('AUTH LOCAL STORAGE REMOVE ERROR', error)
  }
}

/** opcional: helper p/ anexar header em axios globais */
export function setupAxios(axios: any) {
  axios.defaults.headers.Accept = 'application/json'
  axios.interceptors.request.use(
    (config: {headers: {Authorization: string}}) => {
      const auth = getAuth()
      if (auth?.api_token) {
        config.headers.Authorization = `Bearer ${auth.api_token}`
      }
      return config
    },
    (err: any) => Promise.reject(err)
  )
}