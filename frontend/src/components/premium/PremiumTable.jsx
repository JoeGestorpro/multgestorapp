import './PremiumTable.css'

export default function PremiumTable({ columns, rows, onRowClick, onColumnSort, sortKey, sortDir, maxHeight, emptyMessage }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="pm-table-empty">
        <span>{emptyMessage || 'Nenhum registro encontrado'}</span>
      </div>
    )
  }

  return (
    <div className="pm-table-wrap" style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
      <table className="pm-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`pm-th ${col.sortable ? 'pm-th-sortable' : ''} ${sortKey === col.key ? 'pm-th-active' : ''}`}
                onClick={col.sortable ? () => onColumnSort?.(col.key) : undefined}
                style={col.width ? { width: col.width } : undefined}
              >
                <span className="pm-th-content">
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span className="pm-th-arrow">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id || idx}
              className={`pm-tr ${onRowClick ? 'pm-tr-clickable' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className="pm-td" style={col.width ? { width: col.width } : undefined}>
                  {col.render ? col.render(row, idx) : row[col.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
