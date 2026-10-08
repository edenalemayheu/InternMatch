/** Table — simple data table. columns: [{key, label, render?}] */
export default function Table({ columns, rows, emptyMessage = 'No data.' }) {
  if (!rows.length) {
    return <p style={{ color: 'var(--color-neutral-600)', padding: 'var(--space-8)', textAlign: 'center' }}>{emptyMessage}</p>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map(c => <td key={c.key}>{c.render ? c.render(row) : row[c.key] ?? '—'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
