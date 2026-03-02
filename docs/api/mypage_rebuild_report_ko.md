# 마이페이지 재구성 보고서

## 1) 사용한 회원가입 템플릿
- 원본 템플릿: `src/pages/site/auth/join/JoinNormal.jsx`
- 적용 파일: `src/pages/site/auth/Mypage.jsx`
- 재사용 구조:
  - 상단 타이틀 영역
  - 섹션 헤더 + 테이블 본문 패턴
  - 하단 버튼 그룹 배치

## 2) 섹션별 API 매핑
| 섹션 | API | 프론트 함수 |
|---|---|---|
| 사용자 프로필 요약 | `GET /api/users/me` | `mypageApi.getMe` |
| 기본정보 수정 | `PATCH /api/users/me` | `mypageApi.updateMe` |
| 반려동물 목록 | `GET /api/pets/me` | `mypageApi.getMyPets` |
| 내 이벤트 신청 내역 | `GET /api/users/me/event-registrations` | `mypageApi.getMyEventRegistrations` |
| 내 프로그램 신청 내역 | `GET /api/program-applies/my` | `mypageApi.getMyProgramApplies` |
| 로그아웃 | `POST /api/auth/logout` | `AuthProvider.logout` |
| 회원 탈퇴 | `DELETE /api/users/me` | `mypageApi.deleteMe` |

## 3) 누락 엔드포인트
- 본 재구성 범위(프로필/수정/반려동물/이벤트 신청/프로그램 신청/로그아웃/탈퇴) 기준으로 누락 엔드포인트 없음.
- 따라서 비활성 placeholder 섹션을 강제 추가하지 않고, 실제 API 데이터 섹션으로 구성함.

## 4) 수동 점검 내역(설명)
1. 로그인 후 `/mypage` 진입 시 템플릿 구조가 회원가입 계열과 동일한지 확인
2. 기본정보 저장 시 `PATCH /api/users/me` 호출 및 재조회 반영 확인
3. 반려동물 목록/이벤트 신청/프로그램 신청 섹션의 로딩/빈값/정상 데이터 렌더링 확인
4. 로그아웃 버튼 동작 확인
5. 회원 탈퇴 버튼에서 확인창 후 `DELETE /api/users/me` 호출 및 이동 확인