package com.popups.pupoo.storage.infrastructure;

/*
 * ==========================================================
 * [S3 전환용 구현체 - 지금은 주석 처리]
 * ==========================================================
 *
 * 목적
 * - LOCAL(프로젝트 내부 ./uploads) -> S3로 전환할 때
 *   "주석만 풀고" ObjectStoragePort 구현체를 교체하기 위함.
 *
 * 사용 방법
 * 1) build.gradle에 AWS SDK 의존성 추가
 * 2) application-s3.yml 작성
 *    storage.mode=S3
 *    storage.s3.bucket=...
 *    storage.public-base-url=https://cdn... (CloudFront 권장)
 * 3) 이 파일의 주석을 해제하고 컴파일
 *
 * 주의
 * - 팀 규칙/빌드 안정성을 위해 현재는 '전체 주석' 상태로 유지한다.
 */

// import com.popups.pupoo.storage.port.ObjectStoragePort;
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
// import org.springframework.stereotype.Service;
//
// import java.io.ByteArrayInputStream;
// import java.io.InputStream;
//
// @Service
// @ConditionalOnProperty(name = "storage.mode", havingValue = "S3")
// public class S3ObjectStorageService implements ObjectStoragePort {
//
//     @Value("${storage.s3.bucket}")
//     private String bucket;
//
//     @Value("${storage.public-base-url}")
//     private String publicBaseUrl;
//
//     // private final S3Client s3Client; // AWS SDK 필요
//
//     @Override
//     public void putObject(String bucketIgnored, String key, byte[] bytes, String contentType) {
//         // s3Client.putObject(
//         //     PutObjectRequest.builder().bucket(bucket).key(key).contentType(contentType).build(),
//         //     RequestBody.fromBytes(bytes)
//         // );
//     }
//
//     @Override
//     public InputStream getObject(String bucketIgnored, String key) {
//         // 퍼블릭 파일이면 보통 API에서 직접 읽지 않고, public URL을 사용한다.
//         return new ByteArrayInputStream(new byte[0]);
//     }
//
//     @Override
//     public void deleteObject(String bucketIgnored, String key) {
//         // s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
//     }
//
//     @Override
//     public String getPublicPath(String bucketIgnored, String key) {
//         // publicBaseUrl 예: https://cdn.example.com
//         return publicBaseUrl + "/" + key;
//     }
// }
