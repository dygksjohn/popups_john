# 로그인 루프 및 운영 안정화 보고서

## 1) 증상
- 로그인 여부와 상관없이 `/auth/login`으로 반복 이동하거나, 인증이 필요한 페이지 진입 시 시작부터 검증이 막히는 문제가 발생.

## 2) 원인
- 인증 부트스트랩(`isBootstrapped`) 완료 전에 페이지 단에서 로그인 상태를 먼저 판정하는 로직이 존재.
- 라우트 보호/공개 처리 기준이 페이지별로 분산되어 있어 리다이렉트 흐름이 일관되지 않음.
- 대소문자 import 경로 불일치가 운영(Linux) 배포에서 장애를 유발할 수 있는 상태.

## 3) 조치
- `AuthProvider` 개선
  - `isBootstrapped`, `role`, `userId` 동기화 강화
  - 로그아웃 이벤트(`onAuthLogout`) 수신 시 인증 상태 즉시 정리
- 라우팅 보호 정책 통일 (`App.jsx`)
  - `/auth/login` -> `PublicOnly` 적용
  - `/mypage*` 경로 -> `RequireAuth` 적용
  - `/login` -> `/auth/login` 리다이렉트 추가
- 리다이렉트 안정화 (`Login.jsx`)
  - `location.state.from`이 객체/문자열인 경우 모두 처리
  - 잘못 저장된 `post_login_redirect`(`[object Object]`) 방어
  - 로그인 페이지 자기참조(`/auth/login`) 리다이렉트 방지
- 결제 승인/결제내역 페이지 인증 타이밍 보정
  - `isBootstrapped` 이후 인증 판단하도록 수정
- 대소문자 경로 전수 정리
  - `ScrolltoTop`, `Reviews`, `Mypage`, `Location` 경로 정합화
- 스토리지 실사용 점검 강화
  - `MypageStorageUpload`에 "AI 스타일 샘플 3개 생성" 기능 추가
  - 생성된 PNG 파일을 기존 업로더로 바로 전송 가능하도록 연결

## 4) 검증 결과
- 프론트 빌드: `npm run build` 성공
- import 경로 대소문자 전수 검사: 이슈 0건
- 인증/리다이렉트 로직이 부트스트랩 이후 기준으로 동작하도록 통일

## 5) 수동 점검 권장 시나리오
1. 비로그인 상태에서 `/mypage` 직접 접근 -> 로그인 이동 -> 로그인 성공 후 `/mypage` 복귀
2. 로그인 상태에서 `/auth/login` 접근 -> 홈 또는 이전 경로로 자동 이동
3. 결제 승인 URL(`/payment/approve?...`) 진입 시 세션 확인 후 정상 승인/오류 안내
4. `/mypage/storage`에서 샘플 파일 생성 -> 업로드 실행 -> 업로드 결과 확인