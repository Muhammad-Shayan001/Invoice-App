export function exportToCSV<T extends Record<string, any>>(
  filename: string,
  data: T[],
  columns: { key: keyof T | string; label: string; transform?: (val: any, row: T) => string }[]
) {
  if (!data || data.length === 0) return

  // Header row
  const headers = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',')

  // Data rows
  const rows = data.map(row => {
    return columns.map(c => {
      const rawVal = row[c.key as keyof T]
      const processedVal: unknown = c.transform ? c.transform(rawVal, row) : rawVal
      const stringified = processedVal === null || processedVal === undefined ? '' : String(processedVal)
      return `"${stringified.replace(/"/g, '""')}"`
    }).join(',')
  })

  const csvContent = [headers, ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
