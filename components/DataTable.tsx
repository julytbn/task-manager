"use client"

import React, { useState } from 'react'
import { ChevronUp, ChevronDown, Edit2, Trash2, Eye } from 'lucide-react'

type Column = {
  key: string
  label: string
  sortable?: boolean
  width?: string
}

type DataTableProps = {
  columns: Column[]
  data: Record<string, any>[]
  onEdit?: (row: Record<string, any>) => void
  onDelete?: (row: Record<string, any>) => void
  onView?: (row: Record<string, any>) => void
  hasActions?: boolean
  itemsPerPage?: number
}

export default function DataTable({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  hasActions = true,
  itemsPerPage = 10,
}: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Sorting
  const sortedData = React.useMemo(() => {
    let sorted = [...data]
    if (sortConfig) {
      sorted.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    return sorted
  }, [data, sortConfig])

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        }
      }
      return { key, direction: 'asc' }
    })
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg">
      <table className="w-full min-w-full">
        {/* Header */}
        <thead>
          <tr className="table-header border-b-2 border-[var(--color-gold)]/30">
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => column.sortable && handleSort(column.key)}
                className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[var(--color-gold-accent)] transition-all ${
                  column.sortable ? 'hover:bg-[var(--color-black-900)]/30' : ''
                }`}
                style={{ width: column.width || 'auto' }}
              >
                <div className="flex items-center gap-2">
                  <span>{column.label}</span>
                  {column.sortable && (
                    <span className="opacity-0 group-hover:opacity-100">
                      {sortConfig?.key === column.key ? (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )
                      ) : (
                        <ChevronUp size={16} className="opacity-30" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
            {hasActions && (
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {paginatedData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`border-b border-[var(--color-border)] transition-all duration-200 hover:bg-[var(--color-gold)]/5 ${
                rowIndex % 2 === 0
                  ? 'table-row'
                  : 'table-row-alt'
              }`}
            >
              {columns.map((column) => (
                <td
                  key={`${rowIndex}-${column.key}`}
                  className="px-6 py-4 text-sm text-[var(--color-anthracite)]"
                >
                  {row[column.key] || '-'}
                </td>
              ))}
              {hasActions && (
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onView && (
                      <button
                        onClick={() => onView(row)}
                        className="p-2 text-[var(--color-gold)] hover:text-[var(--color-gold-accent)] hover:bg-[var(--color-gold)]/10 rounded-lg transition-all duration-200"
                        title="Afficher"
                      >
                        <Eye size={18} />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="p-2 text-[var(--color-gold)] hover:text-[var(--color-gold-accent)] hover:bg-[var(--color-gold)]/10 rounded-lg transition-all duration-200"
                        title="Éditer"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-6 py-4 bg-[var(--color-offwhite)] rounded-lg border border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-anthracite)]">
            Page {currentPage} sur {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-[var(--color-black-deep)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Précédent
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-lg font-semibold transition-all duration-200 ${
                  currentPage === i + 1
                    ? 'bg-[var(--color-gold)] text-[var(--color-black-deep)]'
                    : 'border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-[var(--color-black-deep)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
