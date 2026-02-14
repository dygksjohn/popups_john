import React from "react";

export default function SlideShell({ id, kicker, title, subtitle, children, rightNote }) {
  return (
    <section id={id} className="snap-start min-h-[100svh] px-6 py-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="rounded-[28px] border border-[var(--color-line)] bg-[var(--color-panel)] p-8 shadow-[var(--shadow-soft)] md:p-10">
              {kicker && (
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  {kicker}
                </div>
              )}
              <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.03em] text-[var(--color-ink)] md:text-[44px]">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-4 max-w-[54ch] text-[15px] leading-7 text-[var(--color-muted)] md:text-[16px]">
                  {subtitle}
                </p>
              )}
              <div className="mt-8">{children}</div>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="rounded-[28px] border border-[var(--color-line)] bg-white/60 p-6 shadow-[var(--shadow-soft)]">
              <div className="text-xs font-semibold tracking-[0.14em] text-[var(--color-muted)]">NOTE</div>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                {rightNote || "PDF 톤(여백·타이포·카드)을 웹으로 옮긴 슬라이드 섹션입니다."}
              </p>

              <div className="mt-6 border-t border-[var(--color-line)] pt-5">
                <div className="text-xs font-semibold text-[var(--color-muted)]">SCROLL</div>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  스크롤하면 다음 슬라이드로 스냅됩니다.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
