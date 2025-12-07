"use client"

import React from 'react'

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  overlay?: boolean
}

export default function Spinner({ size = 'md', overlay = false }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  }

  const spinner = (
    <div
      className={`${sizeClasses[size]} border-[var(--color-gold)]/30 border-t-[var(--color-gold)] rounded-full animate-spin`}
    />
  )

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return spinner
}
