# 로컬 검증 체크리스트

## 0) 실행 준비
1. 루트에서 DB 실행:
   - `docker compose up -d mysql`
2. 백엔드 실행:
   - `cd pupoo_backend`
   - `.\gradlew.bat test`
   - `.\gradlew.bat bootRun`
3. 프론트 실행:
   - `cd ../pupoo_frontend`
   - `Copy-Item .env.example .env -Force`
   - `npm ci`
   - `npm run dev`

## 1) DB/스키마 정합성
1. 백엔드 부팅 로그에서 `ddl-auto=validate` 관련 스키마 오류가 없는지 확인
2. 최신 SQL만 유지되는지 확인:
   - `pupoo_backend/src/main/resources/data/pupoo_db_v5_final.sql`
   - `pupoo_backend/src/main/resources/data/pupoo_seed_v5_final.sql`

## 2) API 1:1 매칭 검증
1. 루트에서 `node tools_api_audit.mjs` 실행
2. 다음 산출물 확인
   - `docs/api/backend_routes.json`
   - `docs/api/frontend_calls.json`
   - `docs/api/api_match_report_ko.md`
   - `docs/api/backend_only.json`
3. 기준값 확인
   - `FRONTEND_ONLY = 0`
   - `BACKEND_ONLY = 0`

## 3) 인증/리프레시/로그인 루프 검증
1. 비로그인 상태에서 보호 페이지(` /mypage `) 접근 시 ` /auth/login ` 이동 확인
2. 로그인 성공 후 원래 목적지로 복귀 확인
3. Access 토큰 제거/만료 상황에서 401 발생 시:
   - ` /api/auth/refresh ` 1회만 호출되는지 확인
   - 성공 시 원요청 재시도 성공 확인
4. 다중 동시 401에서 refresh 요청이 단일 락으로 처리되는지 확인
5. refresh 실패 시 로그아웃 처리 및 로그인 페이지 복귀 확인
6. 쿠키 정책 확인
   - Refresh Cookie Path=`/api/auth`
   - SameSite=`Lax`
   - 로컬 환경 Secure=`false`

## 4) 마이페이지(회원가입 템플릿 재사용) 검증
1. `/mypage`의 컨테이너/섹션/테이블 구조가 회원가입 템플릿 계열과 일관적인지 확인
2. 상태별 렌더링 확인
   - 로딩: 동일 테이블 행 구조 유지
   - 빈값: 동일 컨테이너에서 빈 상태 문구 표시
   - 에러: 하단 에러 영역 고정 표시
   - 정상: 데이터 영역만 치환
3. 기능 확인
   - 기본정보 저장(`PATCH /api/users/me`)
   - 반려동물 목록/관리 진입
   - 내 이벤트 신청 내역 로딩
   - 내 프로그램 신청 내역 로딩
   - 로그아웃

## 5) 보드/갤러리 검증
1. 보드 페이지
   - `/community/freeboard`, `/community/qna`, `/community/notice` 렌더링 및 주요 동작 확인
2. 갤러리 페이지
   - `/gallery/eventgallery`, `/gallery/eventsketch` 렌더링 및 주요 동작 확인
3. 관리자 페이지
   - `/admin/board*`, `/admin/gallery` 렌더링 및 API 호출 확인

## 6) 빌드 게이트
1. 백엔드: `cd pupoo_backend && .\gradlew.bat test`
2. 프론트: `cd pupoo_frontend && npm run build`
3. 둘 다 성공해야 배포 가능 상태로 판단

## 7) 스모크 스크립트
1. 루트에서 아래 순서로 실행
   - `powershell -ExecutionPolicy Bypass -File .\scripts\smoke-db.ps1`
   - `powershell -ExecutionPolicy Bypass -File .\scripts\smoke-backend.ps1`
   - `powershell -ExecutionPolicy Bypass -File .\scripts\smoke-auth.ps1`
   - `powershell -ExecutionPolicy Bypass -File .\scripts\smoke-public-api.ps1`
2. 각 스크립트가 `SMOKE_*_OK`를 출력하는지 확인
