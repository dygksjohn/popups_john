# PUPOO 로컬 실행 가이드

## 1) 사전 요구사항
- Docker Desktop
- JDK 21
- Node.js 20+
- npm 10+

## 2) DB 실행 (최신 SQL 자동 초기화)
```powershell
cd C:\pupoo_workspace
docker compose up -d mysql
docker compose ps
```

DB를 완전히 초기화(볼륨 삭제 후 재생성)하려면:
```powershell
cd C:\pupoo_workspace
powershell -ExecutionPolicy Bypass -File .\scripts\db-reset.ps1
```

## 3) 백엔드 실행
```powershell
cd C:\pupoo_workspace\pupoo_backend
.\\gradlew.bat test
.\\gradlew.bat bootRun
```

기본 접속 정보(환경변수 미지정 시):
- DB URL: `jdbc:mysql://localhost:3306/pupoodb`
- DB USER: `pupoo`
- DB PASSWORD: `pupoo1234!`
- APP URL: `http://localhost:8080`

환경변수가 필요하면 `pupoo_backend/.env.example` 값을 참고해 OS 환경변수로 주입합니다.

## 4) 프론트엔드 실행
```powershell
cd C:\pupoo_workspace\pupoo_frontend
Copy-Item .env.example .env -Force
npm ci
npm run dev
```

기본 접속 URL:
- `http://localhost:5173`

기본 개발 전략:
- Vite proxy 사용(동일 오리진 `/api` 호출)
- `VITE_API_BASE_URL`을 비워두면 프록시 경로를 사용
- 교차 오리진이 필요할 때만 `VITE_API_BASE_URL=http://localhost:8080` 지정

## 5) 프론트 빌드
```powershell
cd C:\pupoo_workspace\pupoo_frontend
npm run build
```

## 6) API 매핑 산출물 갱신
```powershell
cd C:\pupoo_workspace
node tools_api_audit.mjs
```

생성/갱신 파일:
- `docs/api/backend_routes.json`
- `docs/api/frontend_calls.json`
- `docs/api/api_match_report_ko.md`
- `docs/api/backend_only.json`

## 7) 시드 계정 안내
- ADMIN
  - email: `admin@pupoo.com`
  - password: `admin1234`
- USER
  - email: `user001@pupoo.io`
  - password: `admin1234`

## 8) 스모크 테스트 (필수)
```powershell
cd C:\pupoo_workspace
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-db.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-backend.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-auth.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-public-api.ps1
```

한 번에 실행:
```powershell
cd C:\pupoo_workspace
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-all.ps1
```

기대 출력:
- `SMOKE_DB_OK`
- `SMOKE_BACKEND_OK`
- `SMOKE_AUTH_OK`
- `SMOKE_PUBLIC_API_OK`
- `SMOKE_ALL_OK`
