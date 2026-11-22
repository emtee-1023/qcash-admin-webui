import { createContext, useContext } from 'react'
import type { AdminUser } from '../data/types'

export type AuthContextValue = {
  user: AdminUser | null
  checking: boolean
  signIn: (phone: string, password: string, remember: boolean) => Promise<void>
  signOut: () => Promise<void>
  clearSession: () => void
  refresh: () => Promise<void>
  setUser: (user: AdminUser) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
