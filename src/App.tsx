import { useEffect } from 'react'
import { AppShell } from './components/AppShell'
import { ToastProvider } from './components/toast'
import { ThemeProvider } from './components/theme-provider'
import { AuthProvider } from './components/auth-provider'
import { useAuth } from './components/auth-context'
import { DataProvider } from './components/data-provider'
import { NotificationProvider } from './components/notification-provider'
import { Logo } from './components/ui'
import { matchRoute, navigate, useHashRoute } from './lib/router'
import { LoginPage } from './pages/Login'
import { ActivatePage } from './pages/Activate'
import { OverviewPage } from './pages/Overview'
import { BusinessesPage } from './pages/Businesses'
import { BusinessDetailPage } from './pages/BusinessDetail'
import { LendingPage } from './pages/Lending'
import { UsersPage } from './pages/Users'
import { UserDetailPage } from './pages/UserDetail'
import { NotificationsPage } from './pages/Notifications'
import { ProfilePage } from './pages/Profile'

function AdminApplication() {
  const path = useHashRoute()
  const { user, checking, signOut } = useAuth()
  const { clean, segments } = matchRoute(path)
  const root = segments[0] ?? (user ? 'overview' : 'login')
  const isAuthRoute = root === 'login' || root === 'activate'

  useEffect(() => {
    if (checking) return
    if (!user && !isAuthRoute) navigate('/login')
    if (user && isAuthRoute) navigate('/overview')
  }, [checking, isAuthRoute, user])

  if (checking) {
    return (
      <div className="app-loading">
        <Logo variant="light" height={38} />
        <p>Checking admin session…</p>
      </div>
    )
  }

  if (!user) {
    if (root === 'activate') return <ActivatePage />
    return <LoginPage />
  }

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  let page = <OverviewPage />

  if (root === 'businesses') {
    page = segments[1] ? <BusinessDetailPage id={Number(segments[1])} /> : <BusinessesPage />
  } else if (root === 'lending') {
    page = <LendingPage />
  } else if (root === 'users') {
    page = segments[1] ? <UserDetailPage id={Number(segments[1])} /> : <UsersPage />
  } else if (root === 'notifications') {
    page = <NotificationsPage />
  } else if (root === 'profile') {
    page = <ProfilePage onLogout={handleLogout} />
  }

  return (
    <DataProvider>
      <NotificationProvider>
        <AppShell path={isAuthRoute ? '/overview' : clean} onLogout={handleLogout}>
          {page}
        </AppShell>
      </NotificationProvider>
    </DataProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AdminApplication />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
