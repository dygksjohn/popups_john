import {
  buildAssetUrl,
  getConfiguredAssetBaseUrl,
} from "../config/requestUrl";

const assetBaseUrl = getConfiguredAssetBaseUrl(
  import.meta.env.VITE_ASSET_BASE_URL,
  import.meta.env.VITE_API_BASE_URL,
);

export function toPublicAssetUrl(rawUrl) {
  if (!rawUrl) return "";
  const raw = String(rawUrl).trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (/^(data|blob):/i.test(raw)) {
    return raw;
  }

  let normalized = raw.replace(/\\/g, "/");
  const lower = normalized.toLowerCase();
  const uploadsMarkerIndex = lower.indexOf("/uploads/");
  const resourcesUploadsMarkerIndex = lower.indexOf("/resources/uploads/");
  const mainResourcesUploadsMarkerIndex = lower.indexOf(
    "/main/resources/uploads/",
  );
  const srcMainResourcesUploadsMarkerIndex = lower.indexOf(
    "/src/main/resources/uploads/",
  );

  if (uploadsMarkerIndex >= 0) {
    normalized = normalized.substring(uploadsMarkerIndex);
  } else if (srcMainResourcesUploadsMarkerIndex >= 0) {
    normalized = normalized.substring(
      srcMainResourcesUploadsMarkerIndex + "/src/main/resources".length,
    );
  } else if (mainResourcesUploadsMarkerIndex >= 0) {
    normalized = normalized.substring(
      mainResourcesUploadsMarkerIndex + "/main/resources".length,
    );
  } else if (resourcesUploadsMarkerIndex >= 0) {
    normalized = normalized.substring(
      resourcesUploadsMarkerIndex + "/resources".length,
    );
  } else if (lower.startsWith("src/main/resources/uploads/")) {
    normalized = `/${normalized.substring("src/main/resources/".length)}`;
  } else if (lower.startsWith("main/resources/uploads/")) {
    normalized = `/${normalized.substring("main/resources/".length)}`;
  } else if (lower.startsWith("resources/uploads/")) {
    normalized = `/${normalized.substring("resources/".length)}`;
  } else if (lower.startsWith("uploads/")) {
    normalized = `/${normalized}`;
  } else if (lower.startsWith("static/")) {
    normalized = `/${normalized}`;
  } else if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  return buildAssetUrl(assetBaseUrl, normalized);
}
