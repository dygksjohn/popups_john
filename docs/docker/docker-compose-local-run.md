# Docker Compose Local Run

## 실행 전 준비
1. `pupoo_ai/.env.example`를 기준으로 `pupoo_ai/.env`를 준비한다.
2. `pupoo_backend/.env.example`를 기준으로 `pupoo_backend/.env`를 준비한다.
3. `pupoo_backend/.env`에서 DB 접속 정보와 필요한 외부 키를 현재 로컬 환경에 맞게 채운다.
4. `PUPOO_AI_INTERNAL_TOKEN`과 `AI_MODERATION_INTERNAL_TOKEN`은 같은 값으로 맞춘다.
5. frontend는 이번 단계 실행 대상이 아니다. 후속 단계에서 전략을 검토한다.

## docker compose build
```powershell
docker compose build ai backend
```

## docker compose up
```powershell
docker compose up -d ai backend
```

## backend -> ai 통신 확인 방법
1. AI 헬스를 확인한다.
```powershell
curl http://localhost:8000/health
```
2. backend 컨테이너 환경변수가 compose 기준 주소를 사용하는지 확인한다.
```powershell
docker compose exec backend printenv AI_MODERATION_BASE_URL
```
3. 출력이 `http://ai:8000`이면 backend가 compose 네트워크 서비스명으로 AI를 바라보는 상태다.

## 중지 방법
```powershell
docker compose down
```

## 자주 나는 오류
1. `env_file` 관련 오류: `pupoo_ai/.env`, `pupoo_backend/.env`가 없으면 compose가 시작되지 않는다.
2. AI 인증 실패: `PUPOO_AI_INTERNAL_TOKEN`과 `AI_MODERATION_INTERNAL_TOKEN` 값이 다르면 backend 호출이 `401`로 실패한다.
3. backend 기동 실패: 이번 compose에는 DB가 포함되지 않으므로 `pupoo_backend/.env`의 DB 연결 정보가 유효해야 한다.
