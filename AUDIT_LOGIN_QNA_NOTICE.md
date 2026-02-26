# 로그인 / QnA / 공지사항 연동 전수 점검 결과

## 1) 로그인(프론트) 주요 문제

### 문제
- `App.jsx`에서 `Mypage`를 소문자 경로(`./pages/site/auth/mypage`)로 import 하고 있음.
- 실제 파일명은 `Mypage.jsx`라서 리눅스/CI(대소문자 구분 환경)에서 빌드 실패 위험이 큼.

### 해결
- import 경로를 `./pages/site/auth/Mypage`로 수정.

---

## 2) QnA 주요 문제

### 문제 A: 프론트가 DB/API 미연동
- 기존 `QnA.jsx`는 하드코딩 배열(`NOTICES`)로 렌더링하여 실제 DB 데이터와 무관.

### 해결 A
- `src/api/qnaApi.js` 추가 후 `GET /api/qnas` 호출하도록 변경.
- `QnA.jsx`를 API 기반 목록 렌더링으로 교체(로딩/에러/검색 포함).

### 문제 B: 백엔드 인증 방식 불일치
- 기존 `QnaController`는 `X-USER-ID` 헤더를 직접 요구.
- 프로젝트의 다른 API(예: Review)는 JWT + `SecurityUtil.currentUserId()` 패턴을 사용.

### 해결 B
- `QnaController`를 `SecurityUtil` 기반으로 통일.
- 응답 타입도 `ApiResponse<T>`로 통일하여 프론트 파싱 일관성 확보.

### 문제 C: QnA GET 공개 정책 누락
- `EndpointPolicy`의 public GET 목록에 `/api/qnas`가 없어 비로그인 조회 시 차단 가능성.

### 해결 C
- `EndpointPolicy`에 `^/api/qnas(?:/\d+)?$` 패턴 추가.

---

## 3) 공지사항(DB 연동) 관련 점검 메모

### 확인 결과
- 사용자 공지 API `GET /api/notices`는 백엔드에서 DB(`noticeRepository`)를 통해 `PUBLISHED` 공지를 조회하도록 구현되어 있음.
- 즉, "완전 미연동"이라기보다 **데이터 미노출/조회 실패는 상태값, 페이지 파라미터, 배포환경 설정(baseURL/CORS), 데이터 부재**를 우선 의심해야 함.

### 권장 확인 체크리스트
1. DB에 `status = PUBLISHED` 공지가 실제로 존재하는지.
2. 프론트 `VITE_API_BASE_URL`이 백엔드 URL과 일치하는지.
3. 운영 CORS/프록시에서 `/api/notices`가 차단되지 않는지.
4. 관리자에서 생성한 공지의 상태가 `DRAFT`로 저장되지 않았는지.

---

## 4) 추가 권장사항

- QnA 상세/등록/수정/삭제도 동일하게 API 연동(현재는 목록 중심 개선).
- 공지/게시판 API 응답 포맷을 전부 `ApiResponse<T>`로 통일 유지.
- 프론트 API 유틸(`unwrap`)을 공통화해 페이지별 중복 제거.
