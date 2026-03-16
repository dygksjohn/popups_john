package com.popups.pupoo.storage.support;

import com.popups.pupoo.storage.config.StorageProperties;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StorageUrlResolverTest {

    @Test
    void convertsStorageKeyToCdnUrl() {
        StorageUrlResolver resolver = createResolver();

        assertThat(resolver.toPublicUrlFromKey("uploads/event/a.jpg"))
                .isEqualTo("https://cdn.pupoo.site/uploads/event/a.jpg");
    }

    @Test
    void normalizesLeadingSlashWithoutDuplicatingUploadsPrefix() {
        StorageUrlResolver resolver = createResolver();

        assertThat(resolver.toPublicUrlFromKey("/uploads/event/a.jpg"))
                .isEqualTo("https://cdn.pupoo.site/uploads/event/a.jpg");
    }

    @Test
    void returnsNullForNullOrBlankValues() {
        StorageUrlResolver resolver = createResolver();

        assertThat(resolver.toPublicUrlFromKey(null)).isNull();
        assertThat(resolver.toPublicUrlFromKey("   ")).isNull();
        assertThat(resolver.toPublicUrl(null)).isNull();
        assertThat(resolver.toPublicUrl("   ")).isNull();
    }

    @Test
    void passesThroughAbsoluteUrlDuringCompatibilityWindow() {
        StorageUrlResolver resolver = createResolver();
        String absoluteUrl = "https://legacy.pupoo.com/uploads/event/a.jpg";

        assertThat(resolver.toPublicUrl(absoluteUrl)).isEqualTo(absoluteUrl);
        assertThat(resolver.toPublicUrlFromKey(absoluteUrl)).isEqualTo(absoluteUrl);
    }

    private StorageUrlResolver createResolver() {
        StorageProperties storageProperties = new StorageProperties();
        storageProperties.setKeyPrefix("uploads");
        storageProperties.setPublicBaseUrl("http://localhost:8080");
        storageProperties.setCdnBaseUrl("https://cdn.pupoo.site");

        StorageKeyNormalizer normalizer = new StorageKeyNormalizer(storageProperties);
        return new StorageUrlResolver(storageProperties, normalizer);
    }
}
