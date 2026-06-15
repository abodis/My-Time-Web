interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  emptyMessage?: string
}

export default function DataTable<T>({ columns, data, keyExtractor, emptyMessage = "No data available" }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-text-muted">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <table className="w-full">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              className={`text-left text-xs font-medium uppercase text-text-muted px-3 py-2 ${col.className ?? ""}`}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="text-sm">
        {data.map((row, index) => (
          <tr key={keyExtractor(row)} className={`border-b border-surface-border ${index % 2 === 1 ? "bg-gray-50/50" : ""}`}>
            {columns.map((col) => (
              <td key={col.key} className={`px-3 py-3 ${col.className ?? ""}`}>
                {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export type { Column, DataTableProps }
