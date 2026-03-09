import { useEffect, useMemo, useState } from "react";

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
  const [inputValue, setInputValue] = useState(String(currentPage || 1));

  useEffect(() => {
    setInputValue(String(currentPage || 1));
  }, [currentPage]);

  const pageItems = useMemo(
    () => buildPageItems(currentPage, totalPages),
    [currentPage, totalPages],
  );

  if (totalPages <= 1) return null;

  const moveToPage = (nextPage) => {
    const parsed = Number(nextPage);
    if (!Number.isFinite(parsed)) {
      setInputValue(String(currentPage || 1));
      return;
    }

    const safePage = Math.min(totalPages, Math.max(1, Math.floor(parsed)));
    setInputValue(String(safePage));
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
        gap: 18,
        flexWrap: "nowrap",
        marginTop: 36,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          justifyContent: "center",
        }}
      >
        {pageItems.map((item, index) =>
          item === "..." ? (
            <span
              key={`ellipsis-${index}`}
              style={{
                minWidth: 18,
                textAlign: "center",
                fontSize: 15,
                color: "#64748B",
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
                minWidth: 18,
                padding: 0,
                border: "none",
                background: "transparent",
                color: "#111827",
                fontSize: 15,
                fontWeight: item === currentPage ? 800 : 400,
                cursor: "pointer",
              }}
            >
              {item}
            </button>
          ),
        )}

        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={(event) =>
            setInputValue(event.target.value.replace(/[^0-9]/g, ""))
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              moveToPage(inputValue);
            }
          }}
          style={{
            width: 44,
            height: 32,
            border: "1px solid #CBD5E1",
            borderRadius: 6,
            textAlign: "center",
            fontSize: 14,
            color: "#475569",
            outline: "none",
          }}
        />
        <span style={{ fontSize: 14, color: "#64748B" }}>/ {totalPages}</span>
        <button
          type="button"
          onClick={() => moveToPage(inputValue)}
          style={{
            padding: 0,
            border: "none",
            background: "transparent",
            color: "#111827",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          이동
        </button>
      </div>
    </div>
  );
}
