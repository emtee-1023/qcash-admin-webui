import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type ThemeMode } from './theme-context'

const STORAGE_KEY = 'qcash-admin-theme'

function readMode(): ThemeMode {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readMode)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)
  const theme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (meta) meta.content = theme === 'dark' ? '#0b1220' : '#1dab87'
  }, [theme])

  function setMode(next: ThemeMode) {
    setModeState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  function toggle() {
    setMode(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ mode, theme, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
