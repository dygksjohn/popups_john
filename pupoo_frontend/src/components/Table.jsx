export default function Table({ columns, rows }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--color-line)]">
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="bg-[var(--color-surface-2)] text-[var(--color-sub)]">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-5 py-3 font-semibold">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t border-[var(--color-line)]">
                {columns.map((c) => (
                  <td key={c.key} className="px-5 py-3">{r[c.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
