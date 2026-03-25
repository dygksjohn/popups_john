# pupoo 혼잡도 최종보고서 정리 (구현 기준)

우리 구현 기준에서 혼잡도는 `실시간 운영지표 + 모델 예측 + 규칙 보정`을 결합해 `점수(0~100), 레벨(1~5), 예상 대기시간(분), 5분 단위 타임라인, 대체 프로그램 추천`을 만드는 구조다.

## 1) 스토리라인(발표/보고서 권장 순서)
1. 문제정의: 행사장은 순간 피크가 커서 “현재 상태”만으로는 운영 대응이 늦다.
2. 목표: 5분 단위 미래 혼잡도와 대기시간을 예측해 사전 분산 운영을 가능하게 한다.
3. 입력데이터: 입장/퇴장, 대기열, 체크인, 프로그램 수용량, 신청/승인, 체류·밀집 신호, 시계열 60포인트.
4. 예측엔진: LightGBM 기본 예측 + LSTM 보정값 + 컨텍스트 캘리브레이션 + 타임라인 생성.
5. 의사결정: 임계치 초과 시 대체 프로그램 추천(카테고리/시간대 적합성 우선).
6. 결과표현: 관리자 대시보드에 Actual/Predicted 동시 시각화, 예상 대기시간/혼잡레벨 제공.
7. 운영안정성: 모델 실패 시 휴리스틱 fallback으로 서비스 연속성 유지.
8. 비즈니스 효과: 혼잡 사전 완화, 체류 경험 개선, 현장 운영 의사결정 자동화.

## 2) 넣어야 할 이미지(권장 6장)
- 아키텍처 다이어그램: `Backend -> AI internal API -> Prediction/Recommendation -> Dashboard`.
- 데이터 플로우 다이어그램: 입력 지표에서 `predictedAvg/Peak/Wait/timeline` 생성까지.
- 수식 요약 슬라이드: 이벤트/프로그램 점수 계산식과 가중치.
- 타임라인 차트: 5분 단위 곡선(실측 vs 예측) + 피크 구간 표시.
- 추천 결과 화면: 임계치 초과 시 대체 프로그램 Top3와 추천 사유.
- fallback/신뢰도 설명: 모델 미사용 시 `fallbackUsed=true` 흐름.

## 3) 핵심 계산식(코드 기준)
- 이벤트 기본점수  
`event_unit_score = 0.10*entry + 0.16*wait + 0.10*wait_density + 0.14*wait_time + 0.22*preregister + 0.18*participant_conversion + 0.14*inside - 0.04*operation_relief`  
`live_score = event_unit_score * 100`

- 프로그램 기본점수  
`program_unit_score = 0.20*checkin + 0.40*queue + 0.30*wait_time + 0.10*apply_backlog`  
`score = program_unit_score * 100`

- 대기시간 변환  
점수를 구간별 piecewise 함수로 분(min)으로 변환(저혼잡 0분, 고혼잡 최대 60분 캡).

- 타임라인 점수(5분 간격)  
`point_score = clamp(point_base * time_profile + wave + trend)`  
`wave = sin(progress*2π)*2.2`, `trend=(progress-0.5)*3.0`

- 이벤트 컨텍스트 보정  
계획/진행/기타 상태별 blend weight를 다르게 적용(0.35 / 0.58 / 0.12).

- 실시간 로컬 적응(진행중 이벤트)  
최근 시계열로 로컬 LightGBM adaptor 재학습 후 평균/피크/타임라인을 추가 블렌딩.

- 추천 필터  
`candidate_score < current_score`, `candidate_score < threshold`, `종료 임박 제외`, `시간 적합성` 기반 정렬.

## 3-1) 행사 대기/부스 대기 계산식 (추가)

### 행사 단위 대기시간 (AI 예측 서비스)
- 행사 대기 anchor
`density_wait = totalWaitCount / max(runningProgramCount, 1)`
`entry_pressure = min(entryCount / max(activeApplyCount, 1), 1.2)`
`event_wait_anchor = 0.65*averageWaitMinutes + 0.35*density_wait + 1.2*entry_pressure`

- 점수 기반 기본 대기시간
`score_wait = waitFromScore(score)`  
(구간함수: 저혼잡 0분, 고혼잡 최대 60분)

- 최종 포인트 대기시간(타임라인 각 포인트)
`profile_adjusted_anchor = event_wait_anchor * (0.90 + (profile_multiplier - 1.0)*0.5)`
`blended_wait = profile_adjusted_anchor*0.60 + score_wait*0.40`
`point_wait_minutes = round(clamp(blended_wait, 1, 120))`

- 행사 최종 예상 대기시간
`predictedWaitMinutes = 평균(timeline.waitMinutes)`

### 프로그램/부스 대기시간 (실시간 동기화 서비스)
- 프로그램 대기열 인원
`program_queue_count = queueCount + ceil(appliedCount * appliedWeight)`  
(`appliedWeight` 기본 0.35)

- 프로그램 대기시간 계산 분기
1. 처리량(throughputPerMin) 존재 시  
`waitMin = ceil(program_queue_count / throughputPerMin)` (최대 240분 캡)
2. 처리량 없을 시(체류시간 기반)  
`waitMin = ceil(program_queue_count * avgStayMinutes / concurrentCapacity)` (최대 240분 캡)

- 동시수용(concurrentCapacity) 보정
`observedThroughputPerMin = checkins / lookbackMinutes`
`observedConcurrency = ceil(observedThroughputPerMin * avgStayMinutes)`
`concurrentCapacity = max(observedConcurrency, 1)` (fallback: booth concurrency)

- 부스 대기 집계식
`booth_wait_count = Σ(program_queue_count in booth)`
`booth_wait_min = max(program_wait_min in booth)`  
즉, 부스는 “프로그램 대기의 합(인원) + 최장 대기시간(분)”으로 표현.

## 4) 미래 예측을 어떻게 하는가
- 입력 시계열 길이 60을 기준으로 LightGBM feature engineering(통계량/quantile/기울기) 수행.
- 이벤트는 캘린더 피처(요일 sin/cos, 주말/공휴일, 행사 진행률)까지 결합.
- LSTM baseline 출력(보정값)을 별도로 계산해 `lstmPredictedAvgScore`로 제공.
- 5분 단위 타임라인을 행사 시작~종료(또는 프로그램 종료)까지 생성.
- 결과로 `predictedAvgScore`, `predictedPeakScore`, `predictedLevel`, `predictedWaitMinutes`, `confidence`, `timeline` 반환.

## 5) 구현 기능 기준으로 반드시 명시할 포인트
- 내부 API: 이벤트/프로그램 예측 + 프로그램 추천까지 구현됨.
- 백엔드는 AI 서버에 내부 토큰으로 호출하고 2회 재시도함.
- UI는 실측값과 예측값을 함께 보여주고, 예측선 브리징/스무딩 처리함.
- fallback 경로가 있어 모델 아티팩트 부재/실패 시에도 결과를 반환함.

## 6) 아직 미구현이지만 추가하면 좋은 기능
- 예측 신뢰구간(PI50/PI90) 제공으로 “불확실성” 시각화.
- 외생변수 확장: 날씨/교통/주변행사 실시간 반영.
- 온라인 학습 자동화: 이벤트 중 drift 감지 후 즉시 재학습.
- 정책 시뮬레이터: “입장 게이트 추가/프로그램 시간 이동” What-if 분석.
- 추천 최적화: 이동거리/대상 연령/반려견 크기까지 반영한 개인화 추천.
- 운영 알림 자동화: 임계치 초과 예상 시 관리자/참가자 푸시 자동 발송.

## 7) 보고서 표현 주의(신뢰도)
- 현재 구현 기준 명칭은 `LightGBM + LSTM 보정`으로 쓰는 게 정확함.
- “정확도 XX%” 같은 수치는 검증 지표(MAE/RMSE, 데이터 기간) 없으면 단정하지 않는 게 좋음.

## 8) 코드 근거 파일
- `C:/pupoo_workspace/popups/pupoo_ai/app/features/congestion/service/prediction_service.py`
- `C:/pupoo_workspace/popups/pupoo_ai/app/features/congestion/inference/lightgbm_registry.py`
- `C:/pupoo_workspace/popups/pupoo_ai/app/features/congestion/inference/lstm_baseline.py`
- `C:/pupoo_workspace/popups/pupoo_ai/app/features/congestion/dto/prediction_models.py`
- `C:/pupoo_workspace/popups/pupoo_ai/app/api/routers/congestion.py`
- `C:/pupoo_workspace/popups/pupoo_backend/src/main/java/com/popups/pupoo/ai/client/AiInferenceClient.java`
- `C:/pupoo_workspace/popups/pupoo_frontend/src/pages/site/realtime/Dashboard.jsx`
- `C:/pupoo_workspace/popups/pupoo_frontend/src/pages/site/realtime/aiCongestionViewModel.js`
