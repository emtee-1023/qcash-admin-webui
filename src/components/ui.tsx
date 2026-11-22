import {
  useEffect,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Icon, type IconName } from './icons'
import { avatarTone, cx, initials } from '../lib/format'

export function Avatar({
  name,
  size = 40,
  tone,
  className,
  ring = false,
}: {
  name: string
  size?: number
  tone?: string
  className?: string
  ring?: boolean
}) {
  return (
    <span
      className={cx('avatar', ring && 'avatar--ring', className)}
      data-tone={tone ?? avatarTone(name)}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.34) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

export type BadgeTone = 'green' | 'amber' | 'red' | 'gray' | 'blue' | 'purple' | 'navy'

export function Badge({
  children,
  tone = 'gray',
  dot = false,
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  dot?: boolean
  className?: string
}) {
  return (
    <span className={cx('badge', `badge--${tone}`, className)}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  )
}

const businessStatusTone: Record<string, BadgeTone> = {
  active: 'green',
  pending: 'amber',
  suspended: 'red',
  closed: 'gray',
}

const kycTone: Record<string, BadgeTone> = {
  verified: 'green',
  pending: 'amber',
  rejected: 'red',
  unverified: 'gray',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={businessStatusTone[status] ?? 'gray'} dot>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

export function KycBadge({ status }: { status: string }) {
  return (
    <Badge tone={kycTone[status] ?? 'gray'} dot>
      KYC {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

export function AdminBadge({ role }: { role: string }) {
  if (role === 'Super admin') {
    return <Badge tone="purple">Super admin</Badge>
  }
  if (role === 'Admin') {
    return <Badge tone="blue">Admin</Badge>
  }
  return <Badge tone="gray">Customer</Badge>
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'subtle'
type ButtonSize = 'sm' | 'md' | 'lg'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  full = false,
  className,
  type = 'button',
  ...rest
}: {
  children?: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  iconLeft?: IconName
  iconRight?: IconName
  full?: boolean
  className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cx('btn', `btn--${variant}`, `btn--${size}`, full && 'btn--full', className)}
      {...rest}
    >
      {iconLeft && <Icon name={iconLeft} size={size === 'sm' ? 15 : 17} />}
      {children && <span>{children}</span>}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 15 : 17} />}
    </button>
  )
}

export function IconButton({
  icon,
  label,
  className,
  ...rest
}: {
  icon: IconName
  label: string
  className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cx('icon-btn', className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon name={icon} size={18} />
    </button>
  )
}

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return <section className={cx('card', padded && 'card--padded', className)}>{children}</section>
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('card-header', className)}>
      <div>
        <h2 className="card-title">{title}</h2>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string
  hint?: string
  error?: string
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cx('field', className)}>
      <label className="field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? <span className="field__error">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
    </div>
  )
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx('input', className)} {...rest} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="select-wrap">
      <select className={cx('input select', className)} {...rest}>
        {children}
      </select>
      <Icon name="chevronDown" size={16} className="select-wrap__icon" />
    </div>
  )
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx('input textarea', className)} {...rest} />
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Search',
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cx('search-field', className)}>
      <Icon name="search" size={17} />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-label={placeholder}
      />
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onMouseDown={onClose} role="presentation">
      <div
        className={cx('modal', `modal--${size}`)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <IconButton icon="close" label="Close dialog" onClick={onClose} />
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  )
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: string; label: string; count?: number }>
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={cx('tab', active === tab.id && 'tab--active')}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {typeof tab.count === 'number' && <span className="tab__count">{tab.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Pagination({
  page,
  totalPages,
  onChange,
  totalLabel,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
  totalLabel?: string
}) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
  return (
    <div className="pagination">
      <p className="pagination__label">{totalLabel}</p>
      <div className="pagination__controls">
        <button
          type="button"
          className="pagination__arrow"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <Icon name="chevronLeft" size={16} />
        </button>
        {pages.map((item) => (
          <button
            key={item}
            type="button"
            className={cx('pagination__page', page === item && 'pagination__page--active')}
            onClick={() => onChange(item)}
            aria-current={page === item ? 'page' : undefined}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          className="pagination__arrow"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <Icon name="chevronRight" size={16} />
        </button>
      </div>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cx('toggle', checked && 'toggle--on')}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__thumb" />
    </button>
  )
}

export function ProgressBar({ value, tone = 'green' }: { value: number; tone?: string }) {
  return (
    <div className="progress">
      <span className="progress__fill" data-tone={tone} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

export function EmptyState({
  icon = 'search',
  title,
  description,
  action,
}: {
  icon?: IconName
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon name={icon} size={24} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="page-header">
      <div className="page-header__text">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  )
}

export function InfoItem({
  label,
  children,
  full = false,
}: {
  label: string
  children: ReactNode
  full?: boolean
}) {
  return (
    <div className={cx('info-item', full && 'info-item--full')}>
      <span className="info-item__label">{label}</span>
      <span className="info-item__value">{children}</span>
    </div>
  )
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cx('segmented__option', value === option.value && 'segmented__option--active')}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function TrendPill({ value, direction = 'up', muted }: { value: string; direction?: 'up' | 'down'; muted?: boolean }) {
  return (
    <span className={cx('trend-pill', muted && 'trend-pill--muted', direction === 'down' && 'trend-pill--down')}>
      {!muted && <Icon name={direction === 'up' ? 'trendUp' : 'trendDown'} size={13} />}
      {value}
    </span>
  )
}

export function Logo({ variant = 'light', height = 32 }: { variant?: 'light' | 'navy' | 'green'; height?: number }) {
  const sources = {
    light: '/brand/qcash-logo-on-light-transparent.png',
    navy: '/brand/qcash-logo-on-navy-transparent.png',
    green: '/brand/qcash-logo-on-green-transparent.png',
  }
  return (
    <img
      src={sources[variant]}
      alt="QCash"
      style={{ height }}
      className="brand-logo"
    />
  )
}
