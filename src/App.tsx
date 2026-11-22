import { useEffect, useState } from 'react'
import { AppShell } from './components/AppShell'
import { ToastProvider } from './components/toast'
import { ThemeProvider } from './components/theme-provider'
import { NotificationProvider } from './components/notification-provider'
import { matchRoute, navigate, useHashRoute } from './lib/router'
import { LoginPage } from './pages/Login'
import { ActivatePage } from './pages/Activate'
import { OverviewPage } from './pages/Overview'
import { BusinessesPage } from './pages/Businesses'
import { BusinessDetailPage } from './pages/BusinessDetail'
import { UsersPage } from './pages/Users'
import { UserDetailPage } from './pages/UserDetail'
import { NotificationsPage } from './pages/Notifications'
import { ProfilePage } from './pages/Profile'

const SESSION_KEY = 'qcash-admin-preview'

function AdminApplication() {
  const path = useHashRoute()
  const [authenticated, setAuthenticated] = useState(
    () => window.sessionStorage.getItem(SESSION_KEY) === '1',
  )
  const { clean, segments } = matchRoute(path)
  const root = segments[0] ?? 'login'
  const isAuthRoute = root === 'login' || root === 'activate'

  useEffect(() => {
    if (authenticated && isAuthRoute) navigate('/overview')
  }, [authenticated, isAuthRoute])

  function handleSignIn() {
    window.sessionStorage.setItem(SESSION_KEY, '1')
    setAuthenticated(true)
    navigate('/overview')
  }

  function handleLogout() {
    window.sessionStorage.removeItem(SESSION_KEY)
    setAuthenticated(false)
    navigate('/login')
  }

  if (!authenticated) {
    if (root === 'activate') return <ActivatePage />
    return <LoginPage onSignIn={handleSignIn} />
  }

  let page = <OverviewPage />

  if (root === 'businesses') {
    page = segments[1] ? <BusinessDetailPage id={Number(segments[1])} /> : <BusinessesPage />
  } else if (root === 'users') {
    page = segments[1] ? <UserDetailPage id={Number(segments[1])} /> : <UsersPage />
  } else if (root === 'notifications') {
    page = <NotificationsPage />
  } else if (root === 'profile') {
    page = <ProfilePage onLogout={handleLogout} />
  }

  return (
    <AppShell path={isAuthRoute ? '/overview' : clean} onLogout={handleLogout}>
      {page}
    </AppShell>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <NotificationProvider>
          <AdminApplication />
        </NotificationProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
