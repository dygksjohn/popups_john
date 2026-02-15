export default function Card({ className = "", children }) {
  return (
    <div className={`rounded-[var(--radius)] border border-[var(--color-line)] bg-white ${className}`}>
      {children}
    </div>
  );
}
