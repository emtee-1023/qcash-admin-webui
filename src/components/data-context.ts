import { createContext, useContext } from 'react'
import type {
  BusinessTypeResource,
  CountyResource,
} from '../lib/api'
import type { AdminUser, Business } from '../data/types'

export type DataContextValue = {
  businesses: Business[]
  users: AdminUser[]
  businessTypes: BusinessTypeResource[]
  counties: CountyResource[]
  loading: boolean
  refreshing: boolean
  error: string | null
  refresh: () => Promise<void>
  applyBusiness: (business: Business) => void
  applyUser: (user: AdminUser) => void
}

export const DataContext = createContext<DataContextValue | null>(null)

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used within a DataProvider')
  return context
}
