"use client"

import React from 'react'
import { LucideIcon } from 'lucide-react'

type StatCardProps = {
  icon: LucideIcon
  title: string
  value: string | number
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  bgColor?: string
  onClick?: () => void
}

export default function StatCard({
  icon: Icon,
  title,
  value,
  trend,
  bgColor = 'var(--color-surface)',
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className="card h-48 flex flex-col justify-between cursor-pointer group"
      style={{ backgroundColor: bgColor }}
    >
      {/* Top: Icon */}
      <div className="flex items-start justify-between">
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-shadow)] flex items-center justify-center text-[var(--color-black-deep)] group-hover:scale-110 transition-transform duration-300">
          <Icon size={28} className="font-bold" />
        </div>
      </div>

      {/* Middle: Title and Value */}
      <div className="space-y-2">
        <p className="text-sm text-[var(--color-anthracite)] font-medium uppercase tracking-wide">
          {title}
        </p>
        <p className="text-3xl font-bold gold-gradient-text">
          {value}
        </p>
      </div>

      {/* Bottom: Trend */}
      {trend && (
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-semibold ${
              trend.direction === 'up'
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-[var(--color-anthracite)]">
            vs. mois dernier
          </span>
        </div>
      )}
    </div>
  )
}
