import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { api, type ApiError } from '../lib/api'
import { mapBusiness, mapLendingOverview, mapUser } from '../data/mappers'
import type { AdminUser, Business, LendingOverview } from '../data/types'
import { useAuth } from './auth-context'
import { DataContext, type DataContextValue } from './data-context'

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, clearSession, setUser } = useAuth()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [businessTypes, setBusinessTypes] = useState<DataContextValue['businessTypes']>([])
  const [counties, setCounties] = useState<DataContextValue['counties']>([])
  const [lending, setLending] = useState<LendingOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const [businessResponse, userResponse, typeResponse, countyResponse, lendingResponse] =
        await Promise.all([
          api.listBusinesses(),
          api.listUsers(),
          api.listBusinessTypes(),
          api.listCounties(),
          api.getLending().catch(() => null),
        ])
      setBusinesses(businessResponse.data.map(mapBusiness))
      setUsers(userResponse.data.map(mapUser))
      setBusinessTypes(typeResponse.data)
      setCounties(countyResponse.data)
      setLending(lendingResponse ? mapLendingOverview(lendingResponse) : null)
    } catch (caught) {
      const apiError = caught as ApiError
      if (apiError.status === 401) {
        clearSession()
        setError('Your session expired. Please sign in again.')
      } else {
        setError(apiError.message || 'Unable to load console data.')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [clearSession])

  useEffect(() => {
    Promise.resolve().then(() => void refresh())
  }, [refresh])

  const applyBusiness = useCallback((business: Business) => {
    setBusinesses((current) =>
      current.map((item) => (item.id === business.id ? business : item)),
    )
  }, [])

  const applyUser = useCallback(
    (nextUser: AdminUser) => {
      setUsers((current) =>
        current.map((item) => (item.id === nextUser.id ? nextUser : item)),
      )
      if (user?.id === nextUser.id) setUser(nextUser)
    },
    [setUser, user?.id],
  )

  return (
    <DataContext.Provider
      value={{
        businesses,
        users,
        businessTypes,
        counties,
        lending,
        loading,
        refreshing,
        error,
        refresh,
        applyBusiness,
        applyUser,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
