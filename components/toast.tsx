'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void
    error: (message: string) => void
    warning: (message: string) => void
    info: (message: string) => void
  }
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType, duration = 4500) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    warning: (message: string) => addToast(message, 'warning'),
    info: (message: string) => addToast(message, 'info'),
  }

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 shrink-0 text-green-400" />,
    error: <XCircle className="w-5 h-5 shrink-0 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />,
    info: <Info className="w-5 h-5 shrink-0 text-blue-400" />,
  }

  const styles: Record<ToastType, string> = {
    success: 'border-green-500/20 bg-green-500/10',
    error: 'border-red-500/20 bg-red-500/10',
    warning: 'border-amber-500/20 bg-amber-500/10',
    info: 'border-blue-500/20 bg-blue-500/10',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map(t => (
          <div
            key={t.id}
            role="alert"
            aria-live="assertive"
            className={cn(
              'flex items-start gap-3 w-full p-4 rounded-xl border shadow-lg backdrop-blur-sm pointer-events-auto',
              'animate-in slide-in-from-right-4 fade-in-0 duration-200',
              styles[t.type]
            )}
          >
            {icons[t.type]}
            <p className="flex-1 text-sm font-medium text-foreground leading-relaxed">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground transition-colors rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}
