import { useEffect, useState } from 'react'

function readHash() {
  const value = window.location.hash.replace(/^#/, '')
  return value || '/login'
}

export function navigate(to: string) {
  if (window.location.hash === `#${to}`) return
  window.location.hash = to
}

export function useHashRoute() {
  const [path, setPath] = useState(readHash)

  useEffect(() => {
    const onChange = () => setPath(readHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [path])

  return path
}

export function matchRoute(path: string) {
  const clean = path.split('?')[0]
  const segments = clean.split('/').filter(Boolean)
  return { clean, segments }
}
