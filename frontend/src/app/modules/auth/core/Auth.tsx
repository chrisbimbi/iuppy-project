/* eslint-disable react-refresh/only-export-components */
import {FC, useState, useEffect, createContext, useContext, Dispatch, SetStateAction} from 'react'
import {LayoutSplashScreen} from '../../../../layout/core'
import {AuthModel, UserModel} from './_models'
import * as authHelper from './AuthHelpers'
import {getUserByToken, refreshAccessToken} from './_requests'
import {WithChildren} from '../../../../helpers'

type AuthContextProps = {
  auth: AuthModel | undefined
  saveAuth: (auth: AuthModel | undefined) => void
  currentUser: UserModel | undefined
  setCurrentUser: Dispatch<SetStateAction<UserModel | undefined>>
  logout: () => void
}

const initAuthContextPropsState = {
  auth: authHelper.getAuth(),
  saveAuth: () => {},
  currentUser: undefined,
  setCurrentUser: () => {},
  logout: () => {},
}

const AuthContext = createContext<AuthContextProps>(initAuthContextPropsState)

const useAuth = () => useContext(AuthContext)

const AuthProvider: FC<WithChildren> = ({children}) => {
  const [auth, setAuth] = useState<AuthModel | undefined>(authHelper.getAuth())
  const [currentUser, setCurrentUser] = useState<UserModel | undefined>()
  const saveAuth = (auth: AuthModel | undefined) => {
    setAuth(auth)
    if (auth) authHelper.setAuth(auth)
    else authHelper.removeAuth()
  }
  const logout = () => {
    saveAuth(undefined)
    setCurrentUser(undefined)
  }
  return (
    <AuthContext.Provider value={{auth, saveAuth, currentUser, setCurrentUser, logout}}>
      {children}
    </AuthContext.Provider>
  )
}

const AuthInit: FC<WithChildren> = ({children}) => {
  const {auth, currentUser, logout, setCurrentUser} = useAuth()
  const [showSplashScreen, setShowSplashScreen] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      if (!auth?.api_token) {
        logout()
        setShowSplashScreen(false)
        return
      }
      try {
        if (!currentUser) {
          const {data} = await getUserByToken(auth.api_token)
          setCurrentUser(data)
        }
      } catch (err: any) {
        // Se for 401, tenta um refresh manual e repete o /me
        const status = err?.response?.status
        if (status === 401) {
          try {
            const newToken = await refreshAccessToken()
            const {data} = await getUserByToken(newToken)
            setCurrentUser(data)
          } catch {
            logout()
          }
        } else {
          // Network error / queda momentânea: não desloga
          console.error(err)
        }
      } finally {
        setShowSplashScreen(false)
      }
    }

    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return showSplashScreen ? <LayoutSplashScreen /> : <>{children}</>
}

export {AuthProvider, AuthInit, useAuth}