import axios from 'axios'

// Use SEMPRE VITE_API_URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

let accessToken: string | null = null
export const setAccessToken = (t: string | null) => { accessToken = t }

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // recebe/enviará cookie httpOnly do refresh
  headers: { 'Content-Type': 'application/json' },
})

// Injeta Authorization
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

// Refresh automático em 401
let refreshing = false
let queue: Array<() => void> = []

api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      if (!refreshing) {
        refreshing = true
        try {
          const { data } = await api.post('/auth/refresh')
          setAccessToken(data.accessToken)
          queue.forEach((fn) => fn())
          queue = []
        } catch (e) {
          setAccessToken(null)
          throw error
        } finally {
          refreshing = false
        }
      } else {
        await new Promise<void>((res) => queue.push(res))
      }
      return api(original)
    }
    return Promise.reject(error)
  }
)

export default api