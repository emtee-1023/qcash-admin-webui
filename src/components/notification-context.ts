import { createContext, useContext } from 'react'
import type { NotificationItem } from '../data/types'

export type NotificationContextValue = {
  items: NotificationItem[]
  unread: number
  markAllRead: () => void
  toggleRead: (id: number) => void
}

export const NotificationContext = createContext<NotificationContextValue | null>(null)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider')
  return context
}
