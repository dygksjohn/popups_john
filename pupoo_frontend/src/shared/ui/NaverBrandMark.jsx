export function NaverBrandMark({
  size = 20,
  rounded = 6,
  background = "#03C75A",
  color = "#FFFFFF",
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        minWidth: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: rounded,
        background,
      }}
    >
      <svg
        width={Math.round(size * 0.56)}
        height={Math.round(size * 0.56)}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M6 5h4.1l3.8 5.4V5H18v14h-4.1L10.1 13.6V19H6z"
          fill={color}
        />
      </svg>
    </span>
  );
}
