export default function Badge({ tone = "neutral", children }) {
  const map = {
    neutral: "bg-[var(--color-surface-2)] text-[var(--color-sub)] border-[var(--color-line)]",
    success: "bg-[color:color-mix(in_srgb,var(--color-accent-2),white_85%)] text-[color:color-mix(in_srgb,var(--color-accent-2),black_35%)] border-[color:color-mix(in_srgb,var(--color-accent-2),white_45%)]",
    warn: "bg-[color:color-mix(in_srgb,#f59e0b,white_85%)] text-[color:color-mix(in_srgb,#f59e0b,black_35%)] border-[color:color-mix(in_srgb,#f59e0b,white_45%)]",
    accent: "bg-[color:color-mix(in_srgb,var(--color-accent),white_85%)] text-[color:color-mix(in_srgb,var(--color-accent),black_40%)] border-[color:color-mix(in_srgb,var(--color-accent),white_45%)]"
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${map[tone]}`}>{children}</span>;
}
