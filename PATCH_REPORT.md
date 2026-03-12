# PATCH REPORT

## 수정한 파일 목록

- `pupoo_backend/.env.example`
- `pupoo_backend/src/main/java/com/popups/pupoo/common/dashboard/application/AdminDashboardService.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/common/dashboard/dto/DashboardEventResponse.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/common/dashboard/dto/DashboardPastEventResponse.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/common/dashboard/dto/DashboardProgramResponse.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/event/application/EventAdminService.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/event/application/EventService.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/event/dto/EventResponse.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/gallery/application/GalleryAdminService.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/gallery/application/GalleryService.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/program/application/ProgramAdminService.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/program/application/ProgramService.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/program/apply/application/ProgramApplyService.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/program/apply/dto/ProgramApplyResponse.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/program/dto/ProgramResponse.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/program/speaker/application/SpeakerAdminService.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/program/speaker/application/SpeakerService.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/program/speaker/dto/SpeakerResponse.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/storage/application/LocalFileStorageService.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/storage/application/StorageService.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/storage/config/StorageProperties.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/storage/infrastructure/S3ObjectStorageService.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/storage/infrastructure/StorageKeyGenerator.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/storage/support/StorageKeyNormalizer.java`
- `pupoo_backend/src/main/java/com/popups/pupoo/storage/support/StorageUrlResolver.java`
- `pupoo_backend/src/main/resources/application.properties`
- `pupoo_backend/src/main/resources/application-prod.properties`
- 삭제: `pupoo_backend/src/main/java/com/popups/pupoo/common/util/PublicUrlNormalizer.java`

## 전수 조사 결과

### 저장 컬럼 / 도메인

- `event.image_url`
- `event_program.image_url`
- `event_program_apply.image_url`
- `speakers.speaker_image_url`
- `gallery_images.original_url`
- `gallery_images.thumb_url`
- `files.stored_name`
- `qr_codes.original_url`
- 업로드/저장 공통 모듈: `storage/*`

### DB 저장값 형태 확인

기준 파일:

- `db/pupoo_schema_v6.6.sql`
- `db/pupoo_seed_v6.3.sql`

확인된 형태:

- `/uploads/...`
  - `event.image_url`: `/uploads/event/...`
  - `event_program.image_url`: `/uploads/experience/...`, `/uploads/program/...`
  - `event_program_apply.image_url`: `NULL` 다수, 비어 있지 않은 행은 `/uploads/program_apply/...`
  - `gallery_images.original_url`: `/uploads/gallery/...`
  - `gallery_images.thumb_url`: `/uploads/gallery_thumb/...`
  - `qr_codes.original_url`: `/uploads/qr_codes/...`
- `uploads/...`
  - 시드에서 직접 발견되지 않음
- `http://.../uploads/...`
  - 시드에서 발견되지 않음
- `https://...s3.../uploads/...`
  - 시드에서 발견되지 않음
- `event/...`, `gallery/...` 같은 prefix-only 값
  - 시드에서 직접 발견되지 않음
  - 다만 코드/운영 하위호환 대상으로 normalize 지원 추가
- `files.stored_name`
  - 시드 기준 leaf filename only
  - 예: `file_8_1708466772.png`
- `speakers.speaker_image_url`
  - 시드 insert는 컬럼 자체를 생략하고 있어 현재 seed 값은 사실상 `NULL`

## 저장 정책 변경 내용

- 공통 저장 정책을 `key only` 로 통일했다.
- 새 저장값 기본 형식은 `uploads/...` 이다.
  - 예: `uploads/event/...`
  - 예: `uploads/program/...`
  - 예: `uploads/program_apply/...`
  - 예: `uploads/gallery/...`
- `StorageKeyGenerator` 가 신규 key 생성 시 항상 `storage.key-prefix` 를 반영한다.
- 이벤트 / 프로그램 / 참가신청 / 연사 / 갤러리 저장 로직에서 요청값을 그대로 DB에 넣지 않고 `StorageKeyNormalizer.normalizeToKey(...)` 를 거친다.
- `files` 테이블은 스키마 변경 없이 `stored_name` 컬럼을 storage key 저장 용도로 재사용한다.
  - 신규 저장: `stored_name = uploads/post/...` 또는 `uploads/notice/...`
  - 응답의 `storedName` 필드는 기존 계약을 깨지 않도록 leaf filename 만 계속 반환한다.

## 응답 정책 변경 내용

- 클라이언트에 내려가는 파일/이미지 필드는 서비스 계층에서 `StorageUrlResolver` 로 최종 URL 로 조립한다.
- URL 조립 규칙:
  - `storage.public-base-url` 이 있으면 `storage.public-base-url + "/" + key`
  - `storage.public-base-url` 이 없고 `storage.type=S3` 이면 `https://{bucket}.s3.{region}.amazonaws.com/{key}`
  - 로컬 fallback 이면 `/{key}`
- DTO 는 key 를 직접 노출하지 않고, 이미 조립된 URL 만 담는다.

## 공통 처리 추가

- `StorageKeyNormalizer`
  - 하위호환 normalize
  - `/uploads/...`
  - `uploads/...`
  - `http(s)://.../uploads/...`
  - 로컬 classpath/resource 경로
  - `event/...`, `program/...`, `program_apply/...`, `gallery/...`, `notice/...`, `post/...`, `qr_codes/...` 같은 legacy 상대경로
- `StorageUrlResolver`
  - key -> public URL 조립
  - legacy stored value -> normalize -> public URL 조립
- `StorageProperties`
  - `storage.type`
  - `storage.key-prefix`
  - `storage.bucket`
  - `storage.region`
  - `storage.public-base-url`
  - 로컬 fallback / credential 관련 설정 바인딩

## 하위호환 처리 방식

- 읽기 시:
  - legacy `/uploads/...` 값을 `uploads/...` key 로 normalize
  - absolute upload URL/S3 URL 을 key 로 normalize
  - `files.stored_name` 가 예전처럼 leaf filename only 인 경우 `post_id` / `notice_id` 로 key 재조립
- 쓰기 시:
  - 신규 저장은 항상 normalize 후 저장
  - 업로드 응답은 여전히 URL 을 반환하지만, 후속 저장 단계에서 다시 key 로 normalize 하므로 DB 에 URL 이 남지 않음
- 유지한 항목:
  - `/uploads/**` 정적 서빙 설정
  - `/uploads/**` security permit
  - API prefix compatibility filter 의 `/uploads/` 예외
  - 이들은 로컬 fallback/static serving 용도로만 유지했고, 저장 정책에는 더 이상 사용하지 않음

## 영향받는 API 목록

- 이벤트
  - `POST /api/admin/events`
  - `PATCH /api/admin/events/{eventId}`
  - `GET /api/admin/events`
  - `GET /api/admin/events/{eventId}`
  - `PATCH /api/admin/events/{eventId}/status`
  - `GET /api/events`
  - `GET /api/events/{eventId}`
  - `GET /api/events/closed/analytics`
  - `POST /api/admin/events/poster/generate`
  - `POST /api/admin/events/poster/upload`
- 프로그램
  - `POST /api/admin/programs`
  - `PATCH /api/admin/programs/{programId}`
  - `DELETE /api/admin/programs/{programId}`
  - `GET /api/events/{eventId}/programs`
  - `GET /api/programs/{programId}`
- 프로그램 참가
  - `GET /api/program-applies/my`
  - `GET /api/program-applies/programs/{programId}/candidates`
  - `POST /api/program-applies`
  - `GET /api/program-applies/{id}`
  - 관리자 대시보드 연계
    - `GET /api/admin/dashboard/programs/{programId}/applies`
    - `PATCH /api/admin/dashboard/program-applies/{applyId}/status`
    - `DELETE /api/admin/dashboard/program-applies/{applyId}`
- 연사
  - `POST /api/admin/speakers`
  - `PATCH /api/admin/speakers/{speakerId}`
  - `GET /api/speakers`
  - `GET /api/speakers/{speakerId}`
  - `GET /api/programs/{programId}/speakers`
  - `GET /api/programs/{programId}/speakers/{speakerId}`
- 갤러리
  - `GET /api/galleries`
  - `GET /api/galleries/{galleryId}`
  - `POST /api/galleries`
  - `PATCH /api/galleries/{galleryId}`
  - `GET /api/admin/galleries`
  - `POST /api/admin/galleries`
  - `PATCH /api/admin/galleries/{galleryId}`
  - `POST /api/admin/galleries/images/upload`
  - `POST /api/galleries/image/upload`
- 첨부파일
  - `POST /api/files`
  - `POST /api/files/admin/notice`
  - `GET /api/files/by-post/{postId}`
  - `GET /api/files/{fileId}`
  - `GET /api/files/{fileId}/download`
  - `DELETE /api/files/{fileId}`
  - `DELETE /api/files/admin/{fileId}`
- 관리자 대시보드 요약
  - `GET /api/admin/dashboard/events`
  - `GET /api/admin/dashboard/programs`
  - `GET /api/admin/dashboard/events/{eventId}/programs`
  - `GET /api/admin/dashboard/past-events`

## 남은 TODO

- `qr_codes.original_url` 는 seed 상 파일 경로(`/uploads/qr_codes/...`)인데 현재 런타임 코드는 QR payload URL 로도 사용하고 있다.
  - 이 컬럼 의미를 `qr image key` 와 `qr payload url` 중 하나로 정리해야 한다.
- `gallery_images.thumb_url` 은 현재 생성/조립을 정식으로 다루지 않고 있다.
  - 썸네일 생성 정책과 key 저장 정책을 같은 방식으로 정리해야 한다.
- `event_images` 테이블은 스키마에 있지만 현재 백엔드 도메인 로직에서 사용하지 않는다.
  - event poster 다중 이미지 정책이 필요하면 `event.image_url` 과 역할을 재정의해야 한다.
- 임의 외부 URL 입력을 완전히 차단하는 validation 은 아직 넣지 않았다.
  - 현재는 existing behavior 를 최대한 유지하면서, 인식 가능한 legacy 값만 key 로 교정한다.
- `/uploads/**` 로컬 정적 서빙 제거와 presigned URL 정책은 다음 단계에서 정리한다.
