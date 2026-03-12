# AI Compose Step Check

## 범위
- 이번 단계의 실제 컨테이너 작업 대상은 `pupoo_ai`, `pupoo_backend`다.
- `pupoo_frontend`는 이번 단계에서 제외한다.
- AI 서비스는 public URL을 생성하지 않는다.
- AI 서비스는 storage key 또는 내부 참조만 다루는 기존 정책을 유지한다.

## 점검 항목
1. `pupoo_ai/Dockerfile`이 `python:3.12-slim` 기반으로 `0.0.0.0:8000`에서 실행되는지 확인한다.
2. backend의 AI 호출 주소가 compose 내부에서는 `http://ai:8000`으로 주입되는지 확인한다.
3. AI 헬스 엔드포인트는 `GET /health`를 사용한다.
4. `docker-compose.yml`에는 `backend`, `ai`만 포함하고 같은 네트워크에 연결한다.
5. `pupoo_frontend` 관련 컨테이너, 서비스, 빌드 설정은 추가하지 않는다.

## 설정 기준
- backend 외부 포트: `8080`
- ai 외부 포트: `8000`
- backend 내부 AI 주소: `http://ai:8000`
- AI 내부 인증 헤더: `X-Internal-Token`
- 토큰 값은 `pupoo_ai/.env`, `pupoo_backend/.env`에서 동일해야 한다.

## 정책 메모
- backend가 URL 생성 책임을 가진다.
- AI는 public asset URL 생성 로직을 갖지 않는다.
- DB 스키마 변경은 이번 단계 범위가 아니다.
