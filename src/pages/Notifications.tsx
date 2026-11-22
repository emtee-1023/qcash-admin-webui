import { useState } from 'react'
import { useToast } from '../components/toast-context'
import { useNotifications } from '../components/notification-context'
import { Icon, type IconName } from '../components/icons'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  PageHeader,
  Tabs,
} from '../components/ui'
import { timeAgo } from '../lib/format'
import { navigate } from '../lib/router'

const meta: Record<string, { label: string; tone: string; icon: IconName; to: string }> = {
  kyc: { label: 'KYC review', tone: 'amber', icon: 'shield', to: '/businesses' },
  business: { label: 'Business', tone: 'green', icon: 'businesses', to: '/businesses' },
  user: { label: 'User', tone: 'blue', icon: 'users', to: '/users' },
  system: { label: 'System', tone: 'purple', icon: 'settings', to: '/profile' },
}

export function NotificationsPage() {
  const toast = useToast()
  const [tab, setTab] = useState('all')
  const { items, unread, markAllRead, toggleRead } = useNotifications()
  const visible = tab === 'unread' ? items.filter((item) => !item.read) : items

  function handleMarkAllRead() {
    if (unread === 0) return
    markAllRead()
    toast('All notifications marked as read.', 'success')
  }

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Notifications"
        description="Compliance alerts, onboarding updates and platform activity."
        actions={
          <Button variant="secondary" iconLeft="checkCircle" onClick={handleMarkAllRead} disabled={unread === 0}>
            Mark all as read
          </Button>
        }
      />

      <div className="notifications-toolbar">
        <Tabs
          tabs={[
            { id: 'all', label: 'All notifications', count: items.length },
            { id: 'unread', label: 'Unread', count: unread },
          ]}
          active={tab}
          onChange={setTab}
        />
        <span className="toolbar__meta">
          {unread === 0 ? 'You are all caught up' : `${unread} unread`}
        </span>
      </div>

      <Card className="notification-list" padded={false}>
        {visible.length === 0 ? (
          <EmptyState
            icon="checkCircle"
            title="You're all caught up"
            description="There are no unread notifications right now. New compliance and onboarding alerts will appear here."
            action={
              <Button variant="secondary" onClick={() => setTab('all')}>
                View all notifications
              </Button>
            }
          />
        ) : (
          visible.map((item) => {
            const config = meta[item.category]
            return (
              <div
                key={item.id}
                className={`notification-row${item.read ? '' : ' notification-row--unread'}`}
              >
                <span className="notification-row__icon" data-tone={config.tone}>
                  <Icon name={config.icon} size={19} />
                </span>
                <div className="notification-row__body">
                  <strong>
                    {item.title}
                    {!item.read && <span className="unread-dot" />}
                  </strong>
                  <p>{item.description}</p>
                  <div className="notification-row__meta">
                    <Badge tone={config.tone === 'amber' ? 'amber' : config.tone === 'green' ? 'green' : config.tone === 'blue' ? 'blue' : 'purple'}>
                      {config.label}
                    </Badge>
                    <span>{timeAgo(item.time)}</span>
                  </div>
                </div>
                <div className="notification-row__actions">
                  <IconButton
                    icon={item.read ? 'refresh' : 'check'}
                    label={item.read ? 'Mark as unread' : 'Mark as read'}
                    onClick={() => toggleRead(item.id)}
                  />
                  <IconButton
                    icon="chevronRight"
                    label="Open"
                    onClick={() => navigate(config.to)}
                  />
                </div>
              </div>
            )
          })
        )}
      </Card>

      <div className="inline-alert inline-alert--info" style={{ marginTop: 16 }}>
        <Icon name="info" size={15} />
        <span>
          Notifications are a design preview. Delivery preferences can be managed from your
          profile settings.
        </span>
      </div>
    </>
  )
}
