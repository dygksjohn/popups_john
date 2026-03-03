# UI 템플릿 일관성 보고서

## 1) 기준 템플릿
- 기준 페이지: `src/pages/site/auth/join/JoinNormal.jsx`
- 재사용한 핵심 구조:
  - `signup-wrap` 컨테이너
  - `signup-title` 타이틀 구조
  - `section-title` / `section-header` 섹션 구분
  - `form-table` 기반 2열 레이아웃
  - `submit-wrap` 하단 버튼 배치

## 2) 실제 변경 파일과 변경 범위
- 페이지: `src/pages/site/auth/Mypage.jsx`
- API 계층: `src/features/mypage/api/mypageApi.js`
- 변경한 내용:
  - 회원가입 폼 입력 중심 UI를 마이페이지 섹션 데이터 바인딩 구조로 교체
  - API 호출 연결(프로필, 기본정보 수정, 반려동물, 이벤트 신청내역, 프로그램 신청내역, 탈퇴)
  - 인라인 스타일을 클래스(`form-table-bordered`, `section-title-inline`, `status-banner`)로 이동하여 템플릿 구조 유지

## 3) 상태별 레이아웃 일관성 보장 방식
- 로딩 상태:
  - 기존 `form-table` 내부 `th/td` 행 구조를 그대로 유지하고 로딩 문구만 교체
- 빈 상태:
  - 동일 섹션/동일 테이블 안에서 "내역 없음" 문구만 표시
- 에러 상태:
  - 본문 하단 `error-text` 영역에 메시지 표시(레이아웃 고정)
- 정상 데이터 상태:
  - 섹션 외곽 구조는 고정, 리스트 내용(`list-stack`, `list-item`)만 API 데이터로 치환

## 4) 비변경 보장 항목
- 라우팅 구조 미변경 (`/mypage`, `/auth/*` 유지)
- 전역 레이아웃/네비게이션 미변경
- 신규 디자인 시스템 도입 없음
- 기존 템플릿 계열 스타일 규칙(컨테이너/간격/타이포) 유지