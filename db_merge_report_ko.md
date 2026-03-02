# DB 병합 보고서 (db_merge_report_ko)

## 1) SQL 파일 현황
경로: `pupoo_backend/src/main/resources/data/`
- `pupoo_db_v5.1.sql` (레거시)
- `pupoo_db_v5.3.sql` (최신 SSOT)

## 2) 최종 SSOT 결정
- 최종 DB 기준: `pupoo_db_v5.3.sql`
- 특징: 스키마 + 시드 데이터가 단일 파일에 포함됨

결정 근거:
1. 저장소 내 최신 버전이 `v5.3`
2. 런타임/검증 문서에서 `ddl-auto=validate` 기준과 일치하도록 단일 기준 유지 필요
3. 배포/검증 시 파일 참조 혼선을 제거하기 위해 `v5_final`/`seed_v5_final` 분리 참조 제거

## 3) 운영 반영 사항
- `docker-compose.yml` 초기화 SQL 참조를 `pupoo_db_v5.3.sql` 단일 파일로 변경
- `docs/api/validation_checklist_ko.md` DB 검증 경로를 `pupoo_db_v5.3.sql`로 변경
- `integration_validation_ko.md` import 절차를 `pupoo_db_v5.3.sql` 기준으로 변경
- `POLICY_DEVIATIONS.md`의 시드 파일 표기를 `pupoo_db_v5.3.sql` 기준으로 정정

## 4) Deprecated 처리
유지:
- `pupoo_db_v5.1.sql` (레거시 참조용, 실행 기준 아님)

## 5) 코드-스키마 정합성
- 백엔드 테스트(`gradlew.bat test`) 기준 ApplicationContext 로딩 성공
- 애플리케이션 기동 후 스모크 검증에서 `ddl-auto=validate` 관련 부팅 오류 미발생
