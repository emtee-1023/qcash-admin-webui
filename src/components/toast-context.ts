import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}
