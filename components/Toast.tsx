"use client"

import React, { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

type Toast = {
  id: string
  message: string
  type: ToastType
  duration?: number
}

type ToastProps = {
  toast: Toast
  onClose: (id: string) => void
}

function ToastItem({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => onClose(toast.id), toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast, onClose])

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/50',
      textColor: 'text-green-600',
      iconColor: 'text-green-500',
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/50',
      textColor: 'text-red-600',
      iconColor: 'text-red-500',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/50',
      textColor: 'text-yellow-600',
      iconColor: 'text-yellow-500',
    },
    info: {
      icon: Info,
      bgColor: 'bg-[var(--color-gold)]/10',
      borderColor: 'border-[var(--color-gold)]/50',
      textColor: 'text-[var(--color-gold)]',
      iconColor: 'text-[var(--color-gold)]',
    },
  }

  const config = typeConfig[toast.type]
  const Icon = config.icon

  return (
    <div
      className={`flex items-start gap-4 px-4 py-3 rounded-lg border-2 ${config.bgColor} ${config.borderColor} animate-in fade-in-50 slide-in-from-right-full duration-300`}
    >
      <Icon size={20} className={config.iconColor} />
      <p className={`flex-1 text-sm font-medium ${config.textColor}`}>
        {toast.message}
      </p>
      <button
        onClick={() => onClose(toast.id)}
        className={`text-${toast.type === 'success' ? 'green' : toast.type === 'error' ? 'red' : toast.type === 'warning' ? 'yellow' : 'gold'}-500 hover:opacity-70 transition-opacity`}
      >
        <X size={18} />
      </button>
    </div>
  )
}

type ToastContainerProps = {
  toasts: Toast[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 max-w-md">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={onClose}
        />
      ))}
    </div>
  )
}

// Hook pour utiliser les toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { id, message, type, duration }
    setToasts((prev) => [...prev, newToast])
    return id
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const clearAll = () => {
    setToasts([])
  }

  return { toasts, addToast, removeToast, clearAll, ToastContainer: <ToastContainer toasts={toasts} onClose={removeToast} /> }
}
