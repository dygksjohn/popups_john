import React from "react";

export default function CardGrid({ cards }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {cards.map((c) => (
        <div key={c.title} className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <div className="text-base font-semibold tracking-tight">{c.title}</div>
          {c.desc && <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{c.desc}</p>}
          {c.items && (
            <ul className="mt-4 space-y-2 text-sm text-[var(--color-ink)]">
              {c.items.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  <span className="leading-6">{x}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
