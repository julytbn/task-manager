"use client"

import React from 'react'

type ProgressBarProps = {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'md',
}: ProgressBarProps) {
  const percentage = (value / max) * 100

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }

  return (
    <div className="w-full space-y-2">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm font-medium text-[var(--color-black-deep)]">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-bold text-[var(--color-gold)]">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-[var(--color-border)] rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className="h-full bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-accent)] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}
