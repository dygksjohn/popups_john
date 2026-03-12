package com.popups.pupoo.storage.infrastructure;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.storage.port.ObjectStoragePort;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.AwsSessionCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.InputStream;

@Service
@ConditionalOnProperty(name = "storage.mode", havingValue = "S3")
public class S3ObjectStorageService implements ObjectStoragePort {

    private final S3Client s3Client;
    private final String bucket;
    private final String publicBaseUrl;
    private final String keyPrefix;

    public S3ObjectStorageService(
            @Value("${storage.s3.bucket}") String bucket,
            @Value("${storage.s3.region:${AWS_REGION:ap-northeast-2}}") String region,
            @Value("${storage.public-base-url:}") String publicBaseUrl,
            @Value("${storage.s3.key-prefix:uploads}") String keyPrefix,
            @Value("${storage.s3.access-key-id:}") String accessKeyId,
            @Value("${storage.s3.secret-access-key:}") String secretAccessKey,
            @Value("${storage.s3.session-token:}") String sessionToken
    ) {
        if (!StringUtils.hasText(bucket)) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "storage.s3.bucket is required");
        }
        if (!StringUtils.hasText(region)) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "storage.s3.region is required");
        }

        String normalizedBucket = bucket.trim();
        String normalizedRegion = region.trim();

        this.bucket = normalizedBucket;
        this.keyPrefix = normalizeKeyPrefix(keyPrefix);
        this.publicBaseUrl = normalizeBaseUrl(publicBaseUrl, normalizedBucket, normalizedRegion);
        this.s3Client = S3Client.builder()
                .region(Region.of(normalizedRegion))
                .credentialsProvider(resolveCredentialsProvider(accessKeyId, secretAccessKey, sessionToken))
                .build();
    }

    @Override
    public void putObject(String bucketIgnored, String key, byte[] bytes, String contentType) {
        String actualKey = toStorageKey(key);
        try {
            PutObjectRequest.Builder request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(actualKey);
            if (StringUtils.hasText(contentType)) {
                request.contentType(contentType);
            }
            s3Client.putObject(request.build(), RequestBody.fromBytes(bytes));
        } catch (S3Exception e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to upload file to S3: " + safeMessage(e));
        }
    }

    @Override
    public InputStream getObject(String bucketIgnored, String key) {
        String actualKey = toStorageKey(key);
        try {
            return s3Client.getObject(GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(actualKey)
                    .build());
        } catch (NoSuchKeyException e) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "File not found");
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "File not found");
            }
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to read file from S3: " + safeMessage(e));
        }
    }

    @Override
    public void deleteObject(String bucketIgnored, String key) {
        String actualKey = toStorageKey(key);
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(actualKey)
                    .build());
        } catch (S3Exception e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to delete file from S3: " + safeMessage(e));
        }
    }

    @Override
    public String getPublicPath(String bucketIgnored, String key) {
        return publicBaseUrl + "/" + toStorageKey(key);
    }

    @PreDestroy
    public void close() {
        s3Client.close();
    }

    private String toStorageKey(String key) {
        if (!StringUtils.hasText(key)) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "key is required");
        }
        String normalizedKey = stripSlashes(key.trim());
        return keyPrefix.isBlank() ? normalizedKey : keyPrefix + "/" + normalizedKey;
    }

    private static String normalizeBaseUrl(String publicBaseUrl, String bucket, String region) {
        String value = publicBaseUrl;
        if (!StringUtils.hasText(value)) {
            value = "https://" + bucket + ".s3." + region + ".amazonaws.com";
        }
        String normalized = value.trim();
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private static String normalizeKeyPrefix(String keyPrefix) {
        if (!StringUtils.hasText(keyPrefix)) {
            return "";
        }
        return stripSlashes(keyPrefix.trim());
    }

    private static String stripSlashes(String value) {
        String normalized = value.replace('\\', '/');
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private static String safeMessage(S3Exception e) {
        if (e.awsErrorDetails() != null && StringUtils.hasText(e.awsErrorDetails().errorMessage())) {
            return e.awsErrorDetails().errorMessage();
        }
        return e.getMessage();
    }

    private static AwsCredentialsProvider resolveCredentialsProvider(
            String accessKeyId,
            String secretAccessKey,
            String sessionToken
    ) {
        boolean hasAccessKey = StringUtils.hasText(accessKeyId);
        boolean hasSecretKey = StringUtils.hasText(secretAccessKey);

        if (hasAccessKey != hasSecretKey) {
            throw new BusinessException(
                    ErrorCode.INTERNAL_ERROR,
                    "storage.s3.access-key-id and storage.s3.secret-access-key must be configured together"
            );
        }

        if (!hasAccessKey) {
            return DefaultCredentialsProvider.create();
        }

        if (StringUtils.hasText(sessionToken)) {
            return StaticCredentialsProvider.create(
                    AwsSessionCredentials.create(accessKeyId.trim(), secretAccessKey.trim(), sessionToken.trim())
            );
        }

        return StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKeyId.trim(), secretAccessKey.trim())
        );
    }
}
