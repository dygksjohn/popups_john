package com.popups.pupoo.common.util;

import java.util.List;

public final class PublicUrlNormalizer {

    private PublicUrlNormalizer() {
    }

    public static String normalize(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return null;
        }

        String normalized = rawUrl.trim().replace('\\', '/');
        String lower = normalized.toLowerCase();

        if (lower.startsWith("http://") || lower.startsWith("https://")) {
            return normalized;
        }

        int idx = lower.indexOf("/uploads/");
        if (idx >= 0) {
            return normalized.substring(idx);
        }

        idx = lower.indexOf("/src/main/resources/uploads/");
        if (idx >= 0) {
            return normalized.substring(idx + "/src/main/resources".length());
        }

        idx = lower.indexOf("src/main/resources/uploads/");
        if (idx >= 0) {
            return "/" + normalized.substring(idx + "src/main/resources/".length());
        }

        idx = lower.indexOf("/main/resources/uploads/");
        if (idx >= 0) {
            return normalized.substring(idx + "/main/resources".length());
        }

        idx = lower.indexOf("main/resources/uploads/");
        if (idx >= 0) {
            return "/" + normalized.substring(idx + "main/resources/".length());
        }

        idx = lower.indexOf("/resources/uploads/");
        if (idx >= 0) {
            return normalized.substring(idx + "/resources".length());
        }

        idx = lower.indexOf("resources/uploads/");
        if (idx >= 0) {
            return "/" + normalized.substring(idx + "resources/".length());
        }

        idx = lower.indexOf("uploads/");
        if (idx >= 0) {
            return "/" + normalized.substring(idx);
        }

        idx = lower.indexOf("/static/");
        if (idx >= 0) {
            return normalized.substring(idx);
        }

        idx = lower.indexOf("static/");
        if (idx >= 0) {
            return "/" + normalized.substring(idx);
        }

        return normalized.startsWith("/") ? normalized : "/" + normalized;
    }

    public static List<String> normalizeAll(List<String> rawUrls) {
        if (rawUrls == null || rawUrls.isEmpty()) {
            return List.of();
        }
        return rawUrls.stream()
                .map(PublicUrlNormalizer::normalize)
                .toList();
    }
}
