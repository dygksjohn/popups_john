// file: src/main/java/com/popups/pupoo/storage/port/ObjectStoragePort.java
package com.popups.pupoo.storage.port;

import java.io.InputStream;

/**
 * 오브젝트 스토리지 추상화(Port)
 *
 * 구현체를 바꾸더라도(로컬 파일시스템 ↔ S3) 애플리케이션 코드는 이 인터페이스만 의존한다.
 *
 * 매핑 규칙
 * - 로컬/Nginx: bucket은 논리 구분값(환경/도메인 등)으로 사용하고, key가 실제 파일 경로로 매핑된다.
 * - S3: bucket은 실제 버킷 이름, key는 오브젝트 키로 매핑된다.
 */
public interface ObjectStoragePort {

    void putObject(String bucket, String key, byte[] bytes, String contentType);

    InputStream getObject(String bucket, String key);

    void deleteObject(String bucket, String key);

    /**
     * 외부에서 접근 가능한 공개 경로를 반환한다.
     *
     * 예) 로컬/Nginx: /static/post/1/xxx.png
     * 예) S3: https://{bucket}.s3.{region}.amazonaws.com/{key} (또는 CloudFront URL)
     */
    String getPublicPath(String bucket, String key);
}
