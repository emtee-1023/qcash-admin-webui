import { createContext, useContext } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type EffectiveTheme = 'light' | 'dark'

export type ThemeValue = {
  mode: ThemeMode
  theme: EffectiveTheme
  setMode: (mode: ThemeMode) => void
  toggle: () => void
}

export const ThemeContext = createContext<ThemeValue>({
  mode: 'system',
  theme: 'light',
  setMode: () => {},
  toggle: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}
