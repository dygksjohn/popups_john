import React from "react";

export default function MetricRow({ items }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-2xl border border-[var(--color-line)] bg-[color:color-mix(in_srgb,var(--color-panel),#000_2%)] p-4"
        >
          <div className="text-xs font-semibold text-[var(--color-muted)]">{it.label}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{it.value}</div>
          {it.hint && <div className="mt-1 text-xs text-[var(--color-muted)]">{it.hint}</div>}
        </div>
      ))}
    </div>
  );
}
