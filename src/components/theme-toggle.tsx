import { IconButton } from './ui'
import { useTheme } from './theme-context'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <IconButton
      className={className}
      icon={isDark ? 'sun' : 'moon'}
      label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
    />
  )
}
