# DB 병합 보고서 (db_merge_report_ko)

## 1) SQL 파일 탐색 결과
경로: `pupoo_backend/src/main/resources/data/`
- `pupoo_db_v5.1.sql`
- `pupoo_db_v5.2.sql`
- `pupoo_seed_v5.2.sql`
- `pupoo_db_v5_final.sql` (신규)
- `pupoo_seed_v5_final.sql` (신규)

## 2) v5.1 vs v5.2 비교 결과
### 스키마(테이블/컬럼/타입/인덱스/제약)
- v5.1 테이블 수: 47
- v5.2 테이블 수: 48
- 공통 테이블 정의 비교: 의미상 동일(컬럼/타입/PK/FK/UK/인덱스 차이 없음)
- v5.2 신규 테이블: `event_images`

### 시드 데이터 구조
- v5.1: `pupoo_db_v5.1.sql` 내부에 INSERT가 포함된 구조(스키마+시드 혼합)
- v5.2: 스키마(`pupoo_db_v5.2.sql`)와 시드(`pupoo_seed_v5.2.sql`) 분리 구조

## 3) 최종 SSOT 결정
- 최종 스키마: `pupoo_db_v5_final.sql` (v5.2 기반)
- 최종 시드: `pupoo_seed_v5_final.sql` (v5.2 seed 기반)

결정 근거:
1. `kw/testfinish` 기준에서 v5.2가 최신 구조
2. v5.2가 v5.1 대비 확장(`event_images`)을 포함
3. 시드 분리 방식이 운영/검증 절차에 더 일관적

## 4) 변경 매핑 표
| 항목 | v5.1 | v5.2 | 최종(v5_final) | 사유 |
|---|---|---|---|---|
| 스키마 파일 | `pupoo_db_v5.1.sql` | `pupoo_db_v5.2.sql` | `pupoo_db_v5_final.sql`(v5.2) | 최신 기준 정합 |
| 시드 파일 | db 파일에 일부 혼합 | `pupoo_seed_v5.2.sql` 분리 | `pupoo_seed_v5_final.sql`(v5.2 seed) | 배포/검증 절차 단순화 |
| 신규 테이블 | 없음 | `event_images` 추가 | 유지 | 기능 확장 반영 |

## 5) Deprecated 처리
삭제하지 않고 유지:
- `pupoo_db_v5.1.sql` (Deprecated)
- `pupoo_db_v5.2.sql` (Deprecated, 최종 파일로 승격 대체)
- `pupoo_seed_v5.2.sql` (Deprecated, 최종 파일로 승격 대체)

## 6) 코드-스키마 정합
- 최종 DB import 후 Spring Boot JPA 초기화 로그에서 EntityManagerFactory 생성 확인.
- `ddl-auto=validate` 단계에서 스키마 불일치 오류는 발생하지 않음.