# 통합 검증 보고서 (integration_validation_ko)

## 1) 실행 절차

### 1-1. DB 적용
1. DB 생성
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -upupoo -ppupoo1234! -e "CREATE DATABASE IF NOT EXISTS pupoodb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```
2. 최종 스키마 import
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -upupoo -ppupoo1234! pupoodb -e "source C:/pupoo_workspace/integration_all_worktree/pupoo_backend/src/main/resources/data/pupoo_db_v5_final.sql"
```
3. 최종 시드 import
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -upupoo -ppupoo1234! pupoodb -e "source C:/pupoo_workspace/integration_all_worktree/pupoo_backend/src/main/resources/data/pupoo_seed_v5_final.sql"
```

### 1-2. 백엔드 검증
```powershell
cd C:\pupoo_workspace\integration_all_worktree\pupoo_backend
gradlew.bat clean compileJava
gradlew.bat bootRun --args=--server.port=18081
```

### 1-3. 프론트 검증
```powershell
cd C:\pupoo_workspace\integration_all_worktree\pupoo_frontend
npm ci
npm run build
```

## 2) 체크리스트 결과

### DB
- [완료] `pupoo_db_v5_final.sql` import 성공
- [완료] `pupoo_seed_v5_final.sql` import 성공

### Backend
- [완료] `clean compileJava` 성공
- [완료] `bootRun` 로그에서 JPA 초기화 및 EntityManagerFactory 생성 확인
- [완료] `ddl-auto=validate` 관련 스키마 불일치 오류 미발생
- [참고] 서버 포트 점유(8080/18081)로 웹서버 시작은 중단될 수 있으나, validate 구간은 통과

### Frontend
- [완료] `npm run build` 성공
- [완료] axios 통합 규칙 점검
  - 단일 axios 인스턴스 사용
  - `withCredentials=true`
  - baseURL: `VITE_API_BASE_URL` 우선, 미설정 시 `http://localhost:8080`
  - 액세스 토큰 메모리 저장
  - 앱 로드시 `/api/auth/refresh` 호출(AuthProvider)
  - 401 시 refresh 1회 후 재시도
  - 동시 401 처리용 단일 refresh lock(`refreshPromise`) 확인

### API 게이팅
- [완료] 보호 API 무토큰 접근 시 401 확인 (`/api/users/me`)
- [확인 필요] 로그인/리프레시 실계정 시나리오 종단 검증 (환경별 계정/쿠키 정책 의존)

### Board/Gallery CRUD
- [코드 통합 완료] 관련 API 및 프론트 코드 병합 완료
- [확인 필요] 브라우저 수동 E2E CRUD 재현 (운영 정책상 실제 토큰/세션 필요)

### CORS credential
- [완료] 백엔드 CORS allowCredentials=true, 프론트 withCredentials=true 확인

### 동시성(만료 토큰 폭주)
- [완료] 코드 수준 검증: 응답 인터셉터에서 `refreshPromise` 단일화로 동시 401 큐잉 처리
- [확인 필요] 브라우저/실서버 동시 요청 부하 재현 테스트

## 3) 알려진 이슈 및 후속 작업
1. 런타임 포트 충돌(8080/18081) 가능성
   - 기존 실행 프로세스 정리 후 재검증 필요
2. 로그인 E2E 검증
   - 시드 계정의 실사용 비밀번호/정책을 팀 SSOT로 확정 후 자동화 권장
3. 프론트 대형 청크 경고
   - 빌드는 성공하지만 코드 스플리팅 개선 여지 존재