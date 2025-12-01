"use client"

import React from 'react'

type EmptyStateProps = {
  icon?: React.ReactNode
  title?: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title = 'Aucune donnée', description, action }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-lg border border-border p-8 text-center">
      <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 text-2xl mb-4">
        {icon || 'ℹ️'}
      </div>
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      {description && <p className="text-sm text-muted mb-4">{description}</p>}
      {action}
    </div>
  )
}

export default EmptyState
