import { useState, type ReactNode } from 'react'
import { notifications as seedNotifications } from '../data/mock'
import { NotificationContext } from './notification-context'

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState(seedNotifications)
  const unread = items.filter((item) => !item.read).length

  function markAllRead() {
    setItems((current) => current.map((item) => ({ ...item, read: true })))
  }

  function toggleRead(id: number) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, read: !item.read } : item)),
    )
  }

  return (
    <NotificationContext.Provider value={{ items, unread, markAllRead, toggleRead }}>
      {children}
    </NotificationContext.Provider>
  )
}
