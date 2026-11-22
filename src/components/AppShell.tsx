import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon, type IconName } from './icons'
import { Avatar, Badge, IconButton, Logo } from './ui'
import { cx, timeAgo } from '../lib/format'
import { currentAdmin } from '../data/mock'
import { navigate } from '../lib/router'
import { useNotifications } from './notification-context'
import { useTheme } from './theme-context'
import { ThemeToggle } from './theme-toggle'

const navSections: Array<{
  label: string
  items: Array<{ to: string; label: string; icon: IconName; badge?: number }>
}> = [
  {
    label: 'Workspace',
    items: [
      { to: '/overview', label: 'Overview', icon: 'overview' },
      { to: '/businesses', label: 'Businesses', icon: 'businesses', badge: 4 },
      { to: '/users', label: 'Users', icon: 'users' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/notifications', label: 'Notifications', icon: 'bell' },
      { to: '/profile', label: 'My profile', icon: 'user' },
    ],
  },
]

const pageMeta: Record<string, { section: string; title: string }> = {
  overview: { section: 'Workspace', title: 'Overview' },
  businesses: { section: 'Workspace', title: 'Businesses' },
  users: { section: 'Workspace', title: 'Users' },
  notifications: { section: 'Account', title: 'Notifications' },
  profile: { section: 'Account', title: 'My profile' },
}

const notifTone: Record<string, string> = {
  kyc: 'amber',
  business: 'green',
  user: 'blue',
  system: 'purple',
}

const notifIcon: Record<string, IconName> = {
  kyc: 'shield',
  business: 'businesses',
  user: 'users',
  system: 'settings',
}

export function AppShell({
  path,
  onLogout,
  children,
}: {
  path: string
  onLogout: () => void
  children: ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<'notifications' | 'profile' | null>(null)
  const { items, unread, markAllRead, toggleRead } = useNotifications()
  const { theme } = useTheme()
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const segments = path.split('/').filter(Boolean)
  const root = segments[0] ?? 'overview'
  const meta = pageMeta[root] ?? pageMeta.overview
  const title =
    segments.length > 1
      ? root === 'businesses'
        ? 'Business profile'
        : root === 'users'
          ? 'User profile'
          : meta.title
      : meta.title

  useEffect(() => {
    if (!openMenu) return
    const handleClick = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openMenu])

  function go(to: string) {
    setDrawerOpen(false)
    setOpenMenu(null)
    navigate(to)
  }

  return (
    <div className="shell">
      {drawerOpen && (
        <div
          className="sidebar-overlay"
          role="presentation"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <aside className={cx('sidebar', drawerOpen && 'sidebar--open')}>
        <div className="sidebar__brand">
          <a href="#/overview" aria-label="QCash admin home" onClick={() => setDrawerOpen(false)}>
            <Logo variant={theme === 'dark' ? 'navy' : 'light'} height={30} />
          </a>
          <IconButton
            className="sidebar__close"
            icon="close"
            label="Close navigation"
            onClick={() => setDrawerOpen(false)}
          />
        </div>

        <nav className="sidebar__nav" aria-label="Primary navigation">
          {navSections.map((section) => (
            <div key={section.label} className="sidebar__section">
              <p className="sidebar__label">{section.label}</p>
              <div className="sidebar__links">
                {section.items.map((item) => {
                  const active =
                    root === item.to.slice(1) ||
                    (root === 'businesses' && item.to === '/businesses') ||
                    (root === 'users' && item.to === '/users')
                  const badge = item.to === '/notifications' ? unread : item.badge
                  return (
                    <a
                      key={item.to}
                      href={`#${item.to}`}
                      className={cx('nav-link', active && 'nav-link--active')}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setDrawerOpen(false)}
                    >
                      <Icon name={item.icon} size={18} />
                      <span>{item.label}</span>
                      {badge ? <span className="nav-link__badge">{badge}</span> : null}
                    </a>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar__support">
          <span className="sidebar__support-icon">
            <Icon name="help" size={17} />
          </span>
          <strong>Need a hand?</strong>
          <p>Our platform team is here to help with onboarding and compliance questions.</p>
          <a href="mailto:support@qcash.co.ke">
            Contact support
            <Icon name="arrowUpRight" size={13} />
          </a>
        </div>

        <div className="sidebar__admin">
          <Avatar name={currentAdmin.name} size={34} />
          <div className="sidebar__admin-meta">
            <strong>{currentAdmin.name}</strong>
            <span>{currentAdmin.role}</span>
          </div>
          <IconButton icon="logout" label="Sign out" onClick={onLogout} />
        </div>
      </aside>

      <div className="shell__main">
        <header className="topbar">
          <div className="topbar__left">
            <IconButton
              className="topbar__menu icon-btn--bordered"
              icon="menu"
              label="Open navigation"
              onClick={() => setDrawerOpen(true)}
            />
            <div className="topbar__path">
              <span>{meta.section}</span>
              <strong>{title}</strong>
            </div>
          </div>

          <div className="topbar__right" ref={popoverRef}>
            <button
              type="button"
              className="search-field topbar__search"
              onClick={() => go('/businesses')}
            >
              <Icon name="search" size={17} />
              <span className="muted" style={{ fontSize: '0.84rem' }}>
                Search businesses…
              </span>
            </button>

            <ThemeToggle className="topbar__theme" />

            <div className="popover-wrap">
              <IconButton
                className="topbar__bell"
                icon="bell"
                label="Notifications"
                aria-expanded={openMenu === 'notifications'}
                onClick={() =>
                  setOpenMenu((current) => (current === 'notifications' ? null : 'notifications'))
                }
              />
              {openMenu === 'notifications' && (
                <div className="notif-panel" role="dialog" aria-label="Notifications">
                  <div className="notif-panel__header">
                    <h3>
                      Notifications {unread > 0 && <Badge tone="green">{unread} new</Badge>}
                    </h3>
                    <button type="button" onClick={markAllRead}>
                      Mark all read
                    </button>
                  </div>
                  <div className="notif-panel__list">
                    {items.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={cx('notif-item', !item.read && 'notif-item--unread')}
                        onClick={() => toggleRead(item.id)}
                      >
                        <span className="notif-item__icon" data-tone={notifTone[item.category]}>
                          <Icon name={notifIcon[item.category]} size={16} />
                        </span>
                        <span className="notif-item__body">
                          <strong>{item.title}</strong>
                          <p>{item.description}</p>
                          <span>{timeAgo(item.time)}</span>
                        </span>
                        {!item.read && <span className="notif-item__dot" />}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="notif-panel__footer"
                    onClick={() => go('/notifications')}
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>

            <span className="topbar__divider" />

            <div className="popover-wrap">
              <button
                type="button"
                className="topbar__profile"
                aria-expanded={openMenu === 'profile'}
                onClick={() =>
                  setOpenMenu((current) => (current === 'profile' ? null : 'profile'))
                }
              >
                <Avatar name={currentAdmin.name} size={36} />
                <span className="topbar__profile-meta">
                  <strong>{currentAdmin.name}</strong>
                  <span>{currentAdmin.role}</span>
                </span>
                <Icon name="chevronDown" size={15} />
              </button>
              {openMenu === 'profile' && (
                <div className="menu-panel" role="menu">
                  <div className="menu-panel__head">
                    <strong>{currentAdmin.name}</strong>
                    <span>{currentAdmin.email}</span>
                  </div>
                  <button
                    type="button"
                    className="menu-panel__item"
                    role="menuitem"
                    onClick={() => go('/profile')}
                  >
                    <Icon name="user" size={16} />
                    My profile
                  </button>
                  <button
                    type="button"
                    className="menu-panel__item"
                    role="menuitem"
                    onClick={() => go('/notifications')}
                  >
                    <Icon name="bell" size={16} />
                    Notifications
                  </button>
                  <button
                    type="button"
                    className="menu-panel__item"
                    role="menuitem"
                    onClick={() => go('/profile')}
                  >
                    <Icon name="settings" size={16} />
                    Account settings
                  </button>
                  <div className="divider" style={{ margin: '6px 0' }} />
                  <button
                    type="button"
                    className="menu-panel__item menu-panel__item--danger"
                    role="menuitem"
                    onClick={onLogout}
                  >
                    <Icon name="logout" size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="shell__content">
          <div className="content" key={path}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
