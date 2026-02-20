package com.popups.pupoo.storage.port;

import java.io.InputStream;

/**
 * 오브젝트 스토리지 추상화(Port) 인터페이스.
 *
 *
 * 구현체를 바꾸더라도(로컬 파일시스템 ↔ S3) 애플리케이션 코드는 이 인터페이스만 의존한다.
 *
 *   - 로컬/Nginx: bucket 파라미터는 사실상 미사용(구분값 정도)이며, basePath + key 가 실제 파일 경로로 매핑된다.-
 *   - S3: bucket 은 실제 버킷 이름, key 는 오브젝트 키로 매핑된다.-
 *
 * 추후 Ubuntu 서버/EC2 + Nginx 로컬 스토리지로 전환 가이드(바로 복붙용)
 *
 * 1) 서버 디렉토리 준비(예: /var/www/pupoo/static)
 *    sudo mkdir -p /var/www/pupoo/static
 *    sudo chown -R www-data:www-data /var/www/pupoo/static
 *
 * 2) application.yml 예시
 *    storage:
 *      mode: local
 *      local:
 *        base-path: /var/www/pupoo/static
 *        public-prefix: /static
 *
 * 3) Nginx 예시(정적 파일 서빙)
 *    location /static/ {
 *      alias /var/www/pupoo/static/;
 *    }
 *
 * 4) 코드 레벨 전환
 *    - ObjectStoragePort 구현체를 LocalStorageClient 기반으로 사용하도록 Bean 선택
 *    - getPublicPath()는 Nginx가 서빙하는 URL 경로(/static/...)를 리턴
 *
 * 추후 AWS S3 로 전환 가이드(바로 복붙용)
 *
 * 1) 의존성 추가(Gradle)
 *    implementation 'software.amazon.awssdk:s3'
 *
 * 2) application.yml 예시
 *    storage:
 *      mode: s3
 *      s3:
 *        bucket: pupoo-prod-bucket
 *        region: ap-northeast-2
 *        public-prefix: https://{bucket}.s3.{region}.amazonaws.com
 *
 * 3) IAM 권한(예시)
 *    - s3:PutObject, s3:GetObject, s3:DeleteObject
 *
 * 4) 코드 레벨 전환
 *    - ObjectStoragePort 구현체를 S3ObjectStorageService로 교체
 *    - getPublicPath()는 S3 public URL(또는 CloudFront URL)을 리턴
 *
 */
public interface ObjectStoragePort {

    void putObject(String bucket, String key, byte[] bytes, String contentType);

    InputStream getObject(String bucket, String key);

    void deleteObject(String bucket, String key);

    /**
     * 외부에서 접근 가능한 "공개 경로"를 반환한다.
 *
 *
 * 예) 로컬/Nginx 구성이라면 /static/post/1/xxx.png 같은 경로를 리턴해서
     * Nginx가 그대로 서빙할 수 있게 한다.
 *
 *
 * S3 구성이라면 https://bucket.s3.region.amazonaws.com/key 같은 URL 또는
     * CloudFront URL을 리턴하도록 구현할 수 있다.
     */
    String getPublicPath(String bucket, String key);
}
