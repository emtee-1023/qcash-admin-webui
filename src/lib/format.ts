export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function formatKES(minor: number, options?: { compact?: boolean; withSymbol?: boolean }) {
  const amount = minor / 100
  const withSymbol = options?.withSymbol ?? true
  if (options?.compact && Math.abs(amount) >= 1000000) {
    return `${withSymbol ? 'KES ' : ''}${(amount / 1000000).toFixed(1)}M`
  }
  if (options?.compact && Math.abs(amount) >= 1000) {
    return `${withSymbol ? 'KES ' : ''}${(amount / 1000).toFixed(0)}K`
  }
  return `${withSymbol ? 'KES ' : ''}${amount.toLocaleString('en-KE', {
    maximumFractionDigits: 0,
  })}`
}

export function formatApr(bps: number) {
  if (!Number.isFinite(bps) || bps <= 0) return '—'
  return `${(bps / 100).toFixed(1)}%`
}

export function formatDate(value: string | null, options?: { short?: boolean }) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: options?.short ? 'short' : 'short',
    year: 'numeric',
  })
}

export function formatDateTime(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })} · ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

export function timeAgo(value: string) {
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return '—'
  const diff = Date.now() - then
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(value)
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

const avatarTones = ['green', 'navy', 'purple', 'orange', 'blue', 'pink', 'amber']

export function avatarTone(seed: string) {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 997
  }
  return avatarTones[hash % avatarTones.length]
}

export function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function toMinor(value: string) {
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ''))
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
}
