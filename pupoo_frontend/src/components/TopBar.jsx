import React from "react";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-[var(--color-ink)]" />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">애견 행사 통합 운영 플랫폼</div>
            <div className="text-xs text-[var(--color-muted)]">Presentation-style web template (1~5)</div>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-[var(--color-muted)] md:flex">
          <a className="hover:text-[var(--color-ink)]" href="#slide-1">01</a>
          <a className="hover:text-[var(--color-ink)]" href="#slide-2">02</a>
          <a className="hover:text-[var(--color-ink)]" href="#slide-3">03</a>
          <a className="hover:text-[var(--color-ink)]" href="#slide-4">04</a>
          <a className="hover:text-[var(--color-ink)]" href="#slide-5">05</a>
        </nav>
      </div>
    </header>
  );
}
