import React from "react";

export default function CompareTable({ rows }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full text-left text-sm">
          <thead className="bg-[color:color-mix(in_srgb,var(--color-panel),#000_3%)] text-[var(--color-muted)]">
            <tr>
              <th className="px-5 py-4 font-semibold">Service</th>
              <th className="px-5 py-4 font-semibold">Pros</th>
              <th className="px-5 py-4 font-semibold">Cons</th>
              <th className="px-5 py-4 font-semibold">Key Differentiator</th>
            </tr>
          </thead>
          <tbody className="text-[var(--color-ink)]">
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-[var(--color-line)]">
                <td className="px-5 py-4 font-semibold">{r.name}</td>
                <td className="px-5 py-4 text-[var(--color-muted)]">{r.pros}</td>
                <td className="px-5 py-4 text-[var(--color-muted)]">{r.cons}</td>
                <td className="px-5 py-4">{r.diff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[var(--color-line)] bg-[color:color-mix(in_srgb,var(--color-panel),#000_3%)] px-5 py-3 text-xs text-[var(--color-muted)]">
        Mobile: horizontal scroll enabled.
      </div>
    </div>
  );
}
