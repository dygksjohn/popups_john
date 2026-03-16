# Backend Compose Step Check

## 확인 범위

- 멀티스테이지 Dockerfile 유지
- build stage: `eclipse-temurin:21-jdk-jammy`
- runtime stage: `eclipse-temurin:21-jre-jammy`
- `bootJar -x test -PskipFrontendBuild=true` 유지
- compose 환경에서 env override 가능 여부 확인
- health 확인 경로 점검

## 확인 결과

### Dockerfile

- build stage와 runtime stage 베이스 이미지는 요구사항과 일치한다.
- JAR 산출물은 `build/libs/pupoo-backend.jar`로 고정되어 있고, Dockerfile도 동일 경로를 직접 복사하도록 정리했다.
- runtime 기본 프로필은 `SPRING_PROFILES_ACTIVE=prod` 환경변수로 두고, `ENTRYPOINT`에서 프로필을 하드코딩하지 않도록 수정했다.
- JVM 기본 옵션에 `-Dfile.encoding=UTF-8`을 유지했다.
- `./gradlew --no-daemon ...`으로 정리해 컨테이너 빌드에서 데몬 잔존성을 줄였다.

### Spring 설정

- `server.port=${SERVER_PORT:8080}`로 컨테이너 포트 오버라이드가 가능하다.
- `spring.http.encoding.*`와 `server.servlet.encoding.*`는 UTF-8 설정을 유지한다.
- datasource 계정/비밀번호, JWT secret, verification salt의 하드코딩 기본값은 제거했다.
- Kakao OAuth client secret, KakaoPay secret key, AI moderation internal token의 하드코딩 기본값도 제거했다.
- `spring.sql.init.mode`는 환경변수 오버라이드 가능하도록 바꾸고 기본값을 `never`로 조정했다.
  현재 저장소에는 `src/main/resources/db/password_reset_token.sql` 파일이 보이지 않으므로, 기존 `always` 기본값은 깨끗한 컨테이너 부팅 시 실패 가능성이 있다.
- 파일 로그 강제 설정은 발견되지 않았고 기본적으로 stdout/stderr 로깅을 사용한다.
- AI moderation 기본 내부 호출 주소는 `http://ai:8000`으로 두고, `AI_MODERATION_BASE_URL`로 오버라이드 가능하게 유지했다.

### Health

- actuator dependency가 이미 포함되어 있다.
- `management.endpoints.web.exposure.include=health,info`가 설정되어 있다.
- 보안 설정에서 `GET /actuator/health`와 `GET /actuator/health/**`가 `permitAll` 처리되어 있다.
- 추가 공개 헬스 경로로 `GET /api/health`도 존재한다.

## compose에서 권장하는 최소 설정

```yaml
environment:
  SPRING_PROFILES_ACTIVE: prod
  SERVER_PORT: 8080
  SPRING_DATASOURCE_URL: jdbc:mysql://host.docker.internal:3306/pupoodb?serverTimezone=Asia/Seoul&characterEncoding=UTF-8&useUnicode=true&useSSL=false&allowPublicKeyRetrieval=true
  SPRING_DATASOURCE_USERNAME: pupoo
  SPRING_DATASOURCE_PASSWORD: change-me
  AUTH_JWT_SECRET: change-me-base64-secret
  VERIFICATION_HASH_SALT: change-me-random-salt
  APP_STORAGE_MODE: local
  APP_STORAGE_BASE_PATH: ./uploads
  APP_STORAGE_PUBLIC_BASE_URL: http://localhost:8080
```

healthcheck 예시:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
  interval: 30s
  timeout: 5s
  retries: 5
  start_period: 40s
```

`curl` 유무는 실제 compose runtime 이미지 구성에 따라 확인이 필요하다. 별도 도구가 없다면 `/api/health` 또는 `/actuator/health`를 외부에서 확인하면 된다.

현재 workspace 기준으로 compose에 DB 서비스가 없고 호스트의 3306 포트가 열려 있으므로, backend 컨테이너에서는 `localhost` 대신 `host.docker.internal`을 사용해야 한다.
