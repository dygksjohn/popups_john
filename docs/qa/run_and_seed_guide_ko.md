# Pupoo 실행 가이드 (백엔드/프론트/초기 데이터)

## 1. 백엔드 실행

작업 디렉터리: `pupoo_backend`

```bash
./gradlew build -x test && ./gradlew bootRun
```

Windows PowerShell:

```powershell
.\gradlew.bat build -x test
.\gradlew.bat bootRun
```

기본 포트: `8080`

## 2. 프론트엔드 실행

작업 디렉터리: `pupoo_frontend`

```bash
npm install
npm run dev
```

기본 포트: `5173`

## 3. 환경 변수

### 백엔드 (`pupoo_backend/src/main/resources/application.properties`)

- `SPRING_DATASOURCE_URL` (기본: `jdbc:mysql://localhost:3306/pupoodb?...`)
- `SPRING_DATASOURCE_USERNAME` (기본: `pupoo`)
- `SPRING_DATASOURCE_PASSWORD` (기본: `pupoo1234!`)
- `SPRING_JPA_HIBERNATE_DDL_AUTO` (기본: `validate`)
- `VERIFICATION_HASH_SALT`
- `AUTH_JWT_SECRET`
- `KAKAO_OAUTH_CLIENT_ID`
- `KAKAO_OAUTH_REDIRECT_URI` (기본: `http://localhost:5173/auth/kakao/callback`)
- `KAKAOPAY_SECRET_KEY` (카카오페이 연동 시)

### 프론트엔드 (`pupoo_frontend/.env`)

- `VITE_API_BASE_URL=http://localhost:8080`
- `VITE_KAKAO_REST_KEY=...`
- `VITE_KAKAO_REDIRECT_URI=http://localhost:5173/auth/kakao/callback`
- `VITE_KAKAO_MAP_KEY=...` (선택)

## 4. 초기 데이터 시딩

스키마/데이터 파일:

- `pupoo_backend/src/main/resources/data/pupoo_db_v5.5.sql`

예시(MySQL):

```sql
CREATE DATABASE IF NOT EXISTS pupoodb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pupoodb;
SOURCE /absolute/path/to/pupoo_backend/src/main/resources/data/pupoo_db_v5.5.sql;
```

중요:

- `ddl-auto=validate`가 켜져 있으므로 DB 스키마와 엔티티가 정확히 일치해야 서버가 기동됩니다.
- 기존 DB가 있다면 백업 후 적용하세요.

## 5. 로컬 개발 확인 포인트

- 백엔드: `http://localhost:8080`
- 프론트: `http://localhost:5173`
- 자유게시판: `http://localhost:5173/community/freeboard` (`FREE` 게시글만 노출)
- 알림함: `http://localhost:5173/notifications`

## 6. 테스트 실행

백엔드 전체 테스트:

```powershell
cd pupoo_backend
.\gradlew.bat test
```

요구사항 연관 E2E(웹/API 플로우) 테스트만 실행:

```powershell
cd pupoo_backend
.\gradlew.bat test --tests "*SignupFlowE2ETest" --tests "*ProgramApplyFlowE2ETest" --tests "*ReviewWriteFlowE2ETest" --tests "*NotificationFlowE2ETest"
```

커버 시나리오:

- 가입 플로우: 소셜(카카오) 가입 시작 → OTP 검증 → 가입 완료
- 행사 신청 플로우: `pet_id` 포함 프로그램 신청 생성 및 내 신청 목록 조회
- 리뷰 플로우: 후기 작성 및 목록 조회
- 알림 플로우: 인박스 조회 및 클릭(읽음 처리 + 타겟 정보 반환)
