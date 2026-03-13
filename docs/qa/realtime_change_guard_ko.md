# Realtime 변경 작업 가드

목적: `src/pages/site/realtime/Dashboard.jsx` 작업 시 롤백 불일치/화면 반영 누락을 방지한다.

## 고정 원칙

1. 수정 전 기준 커밋과 화면 스냅샷을 먼저 확보한다.
2. 공통 컴포넌트(예: `PageHeader`)는 요청이 없으면 수정하지 않는다.
3. 반영 후 `develop` 대비 diff와 `8080` 실화면 확인을 끝낸 뒤 완료 보고한다.
4. 이상 징후 발생 시 파일 단위로 즉시 기준 커밋 복구하고, 원인/영향만 짧게 보고한다.

## 작업 순서

1. 기준점 확보
   - `git rev-parse --short HEAD`
   - `git diff -- src/pages/site/realtime/Dashboard.jsx`
   - 기준 화면 캡처(수동 또는 도구)
2. 변경 범위 제한
   - 기본 변경 파일: `src/pages/site/realtime/Dashboard.jsx`
   - 요청 없는 공통 컴포넌트 변경 금지
3. 반영 검증
   - `npm run build` (`pupoo_frontend`)
   - `.\gradlew.bat processResources --no-daemon` (`pupoo_backend`)
   - `http://localhost:8080/realtime/dashboard/{eventId}` 확인
4. diff 확인
   - `git diff origin/develop -- src/pages/site/realtime/Dashboard.jsx`
   - 의도 없는 파일 변경 여부 확인
5. 이상 시 즉시 복구
   - `git restore --source=<기준커밋> -- src/pages/site/realtime/Dashboard.jsx`
   - 다시 `processResources` 실행 후 화면 재검증

## 완료 보고 최소 항목

- 변경 파일 목록
- 현재 서빙 번들 해시(`assets/index-*.js`)
- 검증 명령 실행 결과(성공/실패)
