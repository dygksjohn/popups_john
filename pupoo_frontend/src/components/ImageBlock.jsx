export default function ImageBlock({ src, alt = "", className = "", overlay = false, children }) {
  return (
    <div className={`relative overflow-hidden rounded-[var(--radius)] ${className}`}>
      {src ? (
        <img className="h-full w-full object-cover" src={src} alt={alt} />
      ) : (
        <div className="h-full w-full bg-[var(--color-surface-2)] flex items-center justify-center text-sm text-[var(--color-sub)]">
          이미지 자리
        </div>
      )}
      {overlay && <div className="absolute inset-0 hero-overlay" />}
      {children && <div className="absolute inset-0">{children}</div>}
    </div>
  );
}
