"use client"
import React from 'react'

type StatCardLuxeProps = {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: { direction: 'up' | 'down'; value: string }
}

export default function StatCardLuxe({ title, value, icon, trend }: StatCardLuxeProps) {
  return (
    <div className="w-[300px] h-[200px] bg-surface border border-gold rounded-md shadow-subtle p-6 flex flex-col justify-between transition-transform hover:translate-y-[-4px]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center bg-black text-gold rounded-md">{icon}</div>
          <div>
            <div className="text-xs text-anthracite font-serif uppercase tracking-wide">{title}</div>
          </div>
        </div>
        {trend && (
          <div className={`text-sm font-medium ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend.direction === 'up' ? `▲ ${trend.value}` : `▼ ${trend.value}`}
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-3xl font-serif text-black">{value}</div>
      </div>

      <div className="text-xs text-anthracite/80">Dernière 30 jours</div>
    </div>
  )
}
