import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { logout } from './core/_requests'
import { useAuth } from './core/Auth'

const Logout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { saveAuth, setCurrentUser } = useAuth()

  // destino opcional: /logout?to=/auth/login
  const params = new URLSearchParams(location.search)
  const to = params.get('to') || '/auth/login'

  useEffect(() => {
    ; (async () => {
      try {
        await logout()
      } finally {
        // zera auth no front imediatamente
        saveAuth(undefined)
        setCurrentUser(undefined)
        navigate(to, { replace: true })
      }
    })()
  }, [navigate, saveAuth, setCurrentUser, to])

  return (
    <div className="d-flex justify-content-center p-10">
      <span className="spinner-border" />
    </div>
  )
}

export { Logout }
export default Logout