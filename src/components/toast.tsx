import { useCallback, useState, type ReactNode } from 'react'
import { Icon } from './icons'
import { cx } from '../lib/format'
import { ToastContext, type ToastTone } from './toast-context'

type Toast = { id: number; message: string; tone: ToastTone }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3400)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={cx('toast', `toast--${toast.tone}`)}>
            <span className="toast__icon">
              <Icon
                name={toast.tone === 'error' ? 'alert' : toast.tone === 'info' ? 'info' : 'checkCircle'}
                size={18}
              />
            </span>
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast__close"
              aria-label="Dismiss notification"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
