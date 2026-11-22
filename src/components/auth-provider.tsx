import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { api, clearToken, getToken, setToken } from '../lib/api'
import { mapUser } from '../data/mappers'
import type { AdminUser } from '../data/types'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [checking, setChecking] = useState(true)

  const clearSession = useCallback(() => {
    clearToken()
    setUser(null)
    setChecking(false)
  }, [])

  const refresh = useCallback(async () => {
    if (!getToken()) {
      clearSession()
      return
    }
    try {
      const response = await api.me()
      setUser(mapUser(response.data))
    } catch {
      clearSession()
    } finally {
      setChecking(false)
    }
  }, [clearSession])

  useEffect(() => {
    Promise.resolve().then(() => void refresh())
  }, [refresh])

  const signIn = useCallback(
    async (phone: string, password: string, remember: boolean) => {
      const response = await api.login({ phone_number: phone, password })
      setToken(response.token, remember)
      setUser(mapUser(response.user))
      setChecking(false)
    },
    [],
  )

  const signOut = useCallback(async () => {
    try {
      if (getToken()) await api.logout()
    } finally {
      clearSession()
    }
  }, [clearSession])

  return (
    <AuthContext.Provider
      value={{ user, checking, signIn, signOut, clearSession, refresh, setUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}
