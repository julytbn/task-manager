"use client"

import React from 'react'

type StatCardProps = {
  label: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, description, icon, className = '' }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-border shadow-sm p-4 flex items-center justify-between ${className}`}>
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="text-2xl font-bold text-text mt-1">{value}</p>
        {description && <p className="text-xs text-muted mt-1">{description}</p>}
      </div>
      {icon && <div className="text-3xl ml-4">{icon}</div>}
    </div>
  )
}

export default StatCard
