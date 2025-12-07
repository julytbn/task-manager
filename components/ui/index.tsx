"use client"

import React from 'react'

type CardProps = {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
}

export function Card({ children, className = '', hoverable = false }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-border shadow-sm p-6 transition-all ${hoverable ? 'hover:shadow-md hover:border-primaryLight cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
  )
}

type BadgeProps = {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    info: 'bg-primaryLight/10 text-primaryLight',
  }

  return (
    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200'
  
  const variants_map = {
    primary: 'bg-gold hover:bg-gold-bright text-black shadow-sm font-semibold',
    secondary: 'bg-surface hover:bg-offwhite text-anthracite border border-border',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    ghost: 'hover:bg-offwhite text-anthracite',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button className={`${baseStyles} ${variants_map[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}

type SectionProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function Section({ title, subtitle, children, action, className = '' }: SectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">{title}</h2>
          {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  )
}

type GridProps = {
  cols?: 1 | 2 | 3 | 4 | 6
  children: React.ReactNode
  className?: string
}

export function Grid({ cols = 3, children, className = '' }: GridProps) {
  const colMap = { 1: 'grid-cols-1', 2: 'grid-cols-1 md:grid-cols-2', 3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3', 4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4', 6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6' }
  return <div className={`grid ${colMap[cols]} gap-6 ${className}`}>{children}</div>
}

type StatProps = {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: 'up' | 'down'
  trendValue?: string
}

export function Stat({ label, value, icon, trend, trendValue }: StatProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="text-3xl font-bold text-text mt-2">{value}</p>
          {trendValue && (
            <p className={`text-xs font-medium mt-2 ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </p>
          )}
        </div>
        {icon && <div className="text-3xl">{icon}</div>}
      </div>
    </Card>
  )
}

// Expose shared components implemented in separate files
export { StatCard } from './StatCard'
export { Modal } from './Modal'
export { EmptyState } from './EmptyState'
