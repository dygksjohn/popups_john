import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function buildPageItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

export default function CommunityPagination({
  currentPage = 1,
  totalPages = 1,
  onChange,
}) {
  const pageItems = useMemo(
    () => buildPageItems(currentPage, totalPages),
    [currentPage, totalPages],
  );

  if (totalPages <= 1) return null;

  const moveToPage = (nextPage) => {
    const parsed = Number(nextPage);
    if (!Number.isFinite(parsed)) return;
    const safePage = Math.min(totalPages, Math.max(1, Math.floor(parsed)));
    if (safePage !== currentPage && typeof onChange === "function") {
      onChange(safePage);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 36,
      }}
    >
      <button
        type="button"
        onClick={() => moveToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          color: currentPage <= 1 ? "#d1d5db" : "#6b7280",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: currentPage <= 1 ? "default" : "pointer",
          padding: 0,
        }}
      >
        <ChevronLeft size={18} />
      </button>

      {pageItems.map((item, index) =>
        item === "..." ? (
          <span
            key={`ellipsis-${index}`}
            style={{
              width: 36,
              height: 36,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: "#9ca3af",
              userSelect: "none",
            }}
          >
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => moveToPage(item)}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "none",
              background: item === currentPage ? "#1f2937" : "transparent",
              color: item === currentPage ? "#fff" : "#6b7280",
              fontSize: 14,
              fontWeight: item === currentPage ? 700 : 500,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              fontFamily: "inherit",
              transition: "all 0.15s ease",
            }}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => moveToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          color: currentPage >= totalPages ? "#d1d5db" : "#6b7280",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: currentPage >= totalPages ? "default" : "pointer",
          padding: 0,
        }}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
