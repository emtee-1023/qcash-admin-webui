import { useMemo, useState, type ReactNode } from 'react'
import type { NotificationItem } from '../data/types'
import { useData } from './data-context'
import { NotificationContext } from './notification-context'

function buildNotifications(
  businesses: ReturnType<typeof useData>['businesses'],
  users: ReturnType<typeof useData>['users'],
): NotificationItem[] {
  const items: NotificationItem[] = []

  businesses
    .filter((business) => business.kycStatus === 'pending')
    .slice(0, 5)
    .forEach((business) => {
      items.push({
        id: 1000 + business.id,
        title: 'KYC review pending',
        description: `${business.name} is waiting for compliance verification.`,
        category: 'kyc',
        time: business.updatedAt ?? business.createdAt ?? new Date().toISOString(),
        read: false,
      })
    })

  businesses
    .filter((business) => business.status === 'pending')
    .slice(0, 4)
    .forEach((business) => {
      items.push({
        id: 2000 + business.id,
        title: 'Business awaiting approval',
        description: `${business.name} completed onboarding and needs review.`,
        category: 'business',
        time: business.updatedAt ?? business.createdAt ?? new Date().toISOString(),
        read: false,
      })
    })

  businesses
    .filter((business) => business.kycStatus === 'rejected' || business.status === 'suspended')
    .slice(0, 4)
    .forEach((business) => {
      items.push({
        id: 3000 + business.id,
        title: business.status === 'suspended' ? 'Business suspended' : 'KYC documents rejected',
        description:
          business.status === 'suspended'
            ? `${business.name} cannot transact until it is reactivated.`
            : `${business.name} needs corrected verification documents.`,
        category: 'business',
        time: business.updatedAt ?? business.createdAt ?? new Date().toISOString(),
        read: false,
      })
    })

  users
    .filter((user) => user.isAdmin && user.adminActivatedAt)
    .slice(0, 4)
    .forEach((user) => {
      items.push({
        id: 4000 + user.id,
        title: 'Administrator access active',
        description: `${user.name} can access the QCash admin console.`,
        category: 'system',
        time: user.adminActivatedAt ?? user.updatedAt ?? user.createdAt ?? new Date().toISOString(),
        read: false,
      })
    })

  users
    .slice()
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, 3)
    .forEach((user) => {
      items.push({
        id: 5000 + user.id,
        title: 'New QCash account',
        description: `${user.name} registered on QCash${user.businessesCount ? ` with ${user.businessesCount} business${user.businessesCount === 1 ? '' : 'es'}` : ''}.`,
        category: 'user',
        time: user.createdAt ?? user.updatedAt ?? new Date().toISOString(),
        read: false,
      })
    })

  return items.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 16)
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { businesses, users } = useData()
  const [readIds, setReadIds] = useState<number[]>([])
  const source = useMemo(() => buildNotifications(businesses, users), [businesses, users])
  const items = useMemo(
    () => source.map((item) => ({ ...item, read: readIds.includes(item.id) })),
    [readIds, source],
  )
  const unread = items.filter((item) => !item.read).length

  function markAllRead() {
    setReadIds(source.map((item) => item.id))
  }

  function toggleRead(id: number) {
    setReadIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  return (
    <NotificationContext.Provider value={{ items, unread, markAllRead, toggleRead }}>
      {children}
    </NotificationContext.Provider>
  )
}
