export default function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-xl border border-[var(--color-line)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[color:color-mix(in_srgb,var(--color-accent),white_35%)] ${className}`}
      {...props}
    />
  );
}
