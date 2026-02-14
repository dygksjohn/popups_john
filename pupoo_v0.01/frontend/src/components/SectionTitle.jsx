export default function SectionTitle({ kicker, title, desc, align = "left" }) {
  const a = align === "center" ? "text-center" : "text-left";
  return (
    <div className={`${a}`}>
      {kicker && <div className="text-xs font-semibold text-[var(--color-accent)]">{kicker}</div>}
      <h2 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--color-text)]">{title}</h2>
      {desc && <p className="mt-3 text-sm md:text-base leading-7 text-[var(--color-sub)] max-w-3xl mx-auto">{desc}</p>}
    </div>
  );
}
