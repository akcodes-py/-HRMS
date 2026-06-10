import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import EmptyState from './EmptyState'
import SkeletonLoader from './SkeletonLoader'

const DataTable = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found.',
  onRowClick,
}) => {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = (key) => {
    if (!key) return
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...(data || [])].sort((a, b) => {
    if (!sortKey) return 0
    const av = a[sortKey] ?? ''
    const bv = b[sortKey] ?? ''
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
    return sortDir === 'asc' ? cmp : -cmp
  })

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <SkeletonLoader key={i} height="h-10" />
        ))}
      </div>
    )
  }

  if (!sorted.length) {
    return <EmptyState message={emptyMessage} />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map((col) => (
              <th
                key={col.key || col.label}
                onClick={() => col.sortable && handleSort(col.key)}
                className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase
                  tracking-wider whitespace-nowrap
                  ${col.sortable ? 'cursor-pointer hover:text-slate-700 select-none' : ''}`}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <span className="flex flex-col">
                      <ChevronUp
                        size={10}
                        className={sortKey === col.key && sortDir === 'asc'
                          ? 'text-indigo-500'
                          : 'text-slate-300'}
                      />
                      <ChevronDown
                        size={10}
                        className={sortKey === col.key && sortDir === 'desc'
                          ? 'text-indigo-500'
                          : 'text-slate-300'}
                      />
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={() => onRowClick?.(row)}
              className={`hover:bg-slate-50 transition-colors
                ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((col) => (
                <td key={col.key || col.label} className="px-4 py-3 text-slate-700">
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
