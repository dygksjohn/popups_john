# 병합 통합 보고서 (merge_report_ko)

## 1) 기준 브랜치
- 권위 기준(base): `kw/testfinish` (로컬 기준)
- 통합 브랜치: `feature/integration-all`

## 2) 사전 확인 및 실행 메모
- 원본 작업트리(`C:\pupoo_workspace`)에 미커밋 변경이 있어 직접 병합 시 위험이 높았음.
- 안전하게 별도 worktree(`C:\pupoo_workspace\integration_all_worktree`)에서 병합 수행.
- 원격에 `origin/kw/testfinish`가 없어 `pull origin kw/testfinish`는 수행 불가했고, 로컬 `kw/testfinish`를 권위 기준으로 사용.

## 3) 병합 순서(요구 순서 준수)
1. `merge origin/develop`
2. `merge origin/feature/gallery`
3. `merge origin/feature/board`
4. `merge origin/feature/notification`
5. `merge origin/feature/map`

## 4) 주요 충돌 및 해결
### 충돌 A: `SecurityConfig.java`
- 원인: 갤러리 브랜치의 권한 규칙 추가와 기존 보안 규칙 충돌.
- 해결: 기존 정책(ADMIN 분리, 인증 기본 흐름) 유지 + 갤러리 쓰기 API 권한(`hasRole("USER")`)만 통합.
- 우선순위 적용:
  - 정책/보안 규칙 우선
  - 기존 패키지/구조 유지

### 충돌 B: `StorageService.java`
- 원인: 갤러리 임시 업로드 로직과 기존 파일 관리/권한 로직 충돌.
- 해결: `uploadForGalleryTemp`는 유지하고, 기존 NOTICE 업로드 관리자 제한 및 soft-delete 저장 로직 동시 반영.
- 우선순위 적용:
  - DB/정합성 유지
  - Controller→Service→Repository 흐름 보존

### 충돌 C: `StorageController.java`
- 원인: 보드 브랜치 확장 API(`by-post`, `admin/notice`, `admin delete`)와 기존 컨트롤러 충돌.
- 해결: 확장 API를 보존하되 기존 권한 제약/응답 계약(`ApiResponse<T>`) 유지.

### 충돌 D: `Mypage.jsx`
- 원인: 알림 기능 탭 및 설정 연동 코드 대규모 충돌.
- 해결: notification 브랜치 버전을 기준 채택(`theirs`) 후 빌드 검증으로 회귀 확인.

## 5) 통합 후 리스크 구간
- 프론트 `Mypage.jsx`는 단일 파일 변경량이 커서 기능 회귀 가능성이 상대적으로 높음.
- 백엔드 `SecurityConfig`는 경로 매처 증가로 경로 오타/누락 리스크가 있음.
- 포트 점유 환경(8080/18081)으로 인해 런타임 수동 검증 시 인프라 영향이 큼.

## 6) 정책 우선순위 적용 결과
- 정책 문서(운영 SSOT/UIUX SSOT) 확인 후 보안·응답·권한 규칙을 우선 반영.
- DB는 v5.2를 최종 SSOT로 선택하고 코드 정합을 맞춤.
- 구조 규칙(Controller→Service→Repository→Entity)을 변경하지 않음.