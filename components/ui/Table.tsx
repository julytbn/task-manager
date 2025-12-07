"use client"
import React, { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

type Column<T> = {
  key: string
  title: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

type TableProps<T> = {
  columns: Column<T>[]
  data: T[]
  className?: string
  rowsPerPage?: number
}

export default function Table<T extends Record<string, any>>({ columns, data, className = '', rowsPerPage = 10 }: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [data, sortKey, sortDirection])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return sortedData.slice(start, start + rowsPerPage)
  }, [sortedData, currentPage, rowsPerPage])

  const totalPages = Math.ceil(sortedData.length / rowsPerPage)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  return (
    <div className={`w-full overflow-x-auto rounded-md border border-border bg-white ${className}`} style={{maxWidth: '100%'}}>
      <table className="min-w-full divide-y divide-gray-200" style={{width: '100%', maxWidth: '100%'}}>
        <thead className="bg-black">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-3 text-left text-xs font-semibold text-gold uppercase cursor-pointer hover:bg-black-900 ${col.className ?? ''}`}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="flex items-center space-x-1">
                  <span>{col.title}</span>
                  {col.sortable && sortKey === col.key && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-offwhite divide-y" style={{ borderTop: '1px solid #E0E0E0' }}>
          {paginatedData.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-offwhite'}>
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-anthracite">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pagination */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <div className="text-sm text-anthracite">Page {currentPage} sur {totalPages}</div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-border rounded text-anthracite disabled:opacity-50"
          >
            Précédent
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded text-sm ${currentPage === page ? 'bg-gold text-black font-medium' : 'border border-border text-anthracite'}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-border rounded text-anthracite disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  )
}
