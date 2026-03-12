const ABSOLUTE_URL_RE = /^https?:\/\//i;
const SPECIAL_URL_RE = /^(data|blob):/i;

export const DEFAULT_IMAGE_FALLBACK_URL = "/logo_gray.png";

export function toPublicAssetUrl(rawUrl) {
  if (!rawUrl) return "";
  const raw = String(rawUrl).trim();
  if (!raw) return "";

  if (ABSOLUTE_URL_RE.test(raw)) {
    return raw;
  }

  if (SPECIAL_URL_RE.test(raw)) {
    return raw;
  }

  return raw.startsWith("/") ? raw : "";
}

export function resolveImageUrl(
  rawUrl,
  fallbackUrl = DEFAULT_IMAGE_FALLBACK_URL,
) {
  return toPublicAssetUrl(rawUrl) || toPublicAssetUrl(fallbackUrl) || fallbackUrl;
}

export function createImageFallbackHandler(
  fallbackUrl = DEFAULT_IMAGE_FALLBACK_URL,
) {
  const resolvedFallback = resolveImageUrl(fallbackUrl, DEFAULT_IMAGE_FALLBACK_URL);

  return (event) => {
    const target = event?.currentTarget || event?.target;
    if (!target) return;
    if (target.dataset.fallbackApplied === "true") return;
    target.dataset.fallbackApplied = "true";
    target.src = resolvedFallback;
  };
}
