export default function Button({ as: Comp = "button", variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[var(--color-accent)] text-white hover:brightness-105 shadow-[var(--shadow-soft)]",
    outline: "border border-[var(--color-line)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
    ghost: "text-white/90 hover:text-white hover:bg-white/10",
    link: "text-[var(--color-accent)] hover:underline px-0 py-0 rounded-none"
  };
  return <Comp className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
