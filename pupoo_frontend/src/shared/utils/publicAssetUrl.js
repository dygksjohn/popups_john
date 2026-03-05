const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/+$/, "");

export function toPublicAssetUrl(rawUrl) {
  if (!rawUrl) return "";
  const raw = String(rawUrl).trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  let normalized = raw.replace(/\\/g, "/");
  const markerIndex = normalized.toLowerCase().indexOf("/uploads/");
  if (markerIndex >= 0) {
    normalized = normalized.substring(markerIndex);
  } else if (normalized.toLowerCase().startsWith("uploads/")) {
    normalized = `/${normalized}`;
  } else if (normalized.toLowerCase().startsWith("static/")) {
    normalized = `/${normalized}`;
  } else if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  return `${API_BASE}${normalized}`;
}

