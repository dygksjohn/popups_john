# pupoo 발표자료 수정/추가/삭제 정리 (코드 검증 반영 상세판)

## 0) 코드 검증 범위
- 검토 기준 저장소: `C:\pupoo_workspace\popups`
- 핵심 확인 영역: 포스터 생성, 챗봇 누리, RAG 금칙어 필터, 혼잡도 예측
- 확인 실패 항목: 로컬에 `pytest` 미설치로 자동 테스트 실행은 미수행

## 1) 반드시 수정 (사실 불일치 + 발표 신뢰도 영향)
- 슬라이드 번호/분모 불일치 수정
- 현재 `02/22`, `08/18`, `20/22` 혼재, 실제 파일은 18장
- 목차 슬라이드(2장) 내용 정정
- `Slide 19~22`, `총 22장` 표기 삭제 또는 18장 기준으로 재작성
- 시간 표기 불일치 정정
- 목차는 PART 2 `약 10분`, 본문은 `AI 기능 시연 (15분)`으로 충돌
- 오타 수정
- `새레모니` → `세리머니`
- 모델/브랜드 표기 통일
- `IBM WATSONX`, `IBM watsonx`, `watsonx.ai`를 하나로 통일

## 2) 코드 기준으로 “수정 필요한 기술 문구”

### 2-1) 생성형 포스터 파트
- 수정 필요: `Spring Boot 비동기(Async) 호출`
- 코드상 `RestClient.post()` 동기 호출로 구현됨
- 근거: `pupoo_backend/src/main/java/com/popups/pupoo/event/application/AdminEventPosterService.java:128,142`
- 수정 필요: `1024×1024 고해상도 생성`
- 코드상 요청 사이즈는 `1024x1792`, 이후 결과는 `400x847`로 정규화
- 근거: `AdminEventPosterService.java:52,53,54,134,280`
- 유지 가능: 관리자 기능에서 포스터 생성/업로드 API 제공
- 근거: `pupoo_backend/src/main/java/com/popups/pupoo/event/api/AdminEventOperationController.java:89,96`

### 2-2) 챗봇 누리 파트
- 수정 필요: `4가지 Intent Handler 구현`
- 코드상 라우팅 분기는 `navigation/summary/draft/unsupported/execute` 5가지
- 근거: `pupoo_ai/app/features/chatbot/service/chatbot_service.py:41,43,45,47,49`
- 유지 가능: Bedrock(Nova) 기반 챗봇 + 백엔드 프록시 구조
- 근거: `pupoo_ai/app/features/chatbot/service/bedrock_client.py:25,26`
- 근거: `pupoo_backend/src/main/java/com/popups/pupoo/common/chatbot/api/ChatbotProxyController.java:25,42,49`
- 유지 가능: 관리자 권한 보호
- 근거: `pupoo_backend/src/main/java/com/popups/pupoo/auth/security/config/SecurityConfig.java:191`

### 2-3) RAG 금칙어 필터 파트
- 유지 가능: Milvus + watsonx 기반 RAG 구조
- 근거: `pupoo_ai/app/features/moderation/milvus_client.py:93,106`
- 근거: `pupoo_ai/app/features/moderation/rag_service.py:11,13,66`
- 유지 가능: FAIL-CLOSED(BLOCK 우선) 정책
- watsonx 미설정/호출 실패/파싱 실패 시 BLOCK 처리
- 근거: `rag_service.py:82,84,89,90`
- 근거: `watsonx_client.py:69,70,93,94,129,130,191,192`
- 유지 가능: 백엔드 저장 전 차단 + 로그 기록
- 근거: `pupoo_backend/src/main/java/com/popups/pupoo/reply/application/ReplyService.java:105,107,115`
- 근거: `pupoo_backend/src/main/java/com/popups/pupoo/board/bannedword/application/BannedWordService.java:42,46`

### 2-4) 혼잡도 예측 파트
- 수정 필요: `PyTorch LSTM + LightGBM`
- 현재 코드상 핵심은 `LightGBM + sklearn Ridge 기반 LSTM 보정`
- 근거: `pupoo_ai/app/features/congestion/inference/lstm_baseline.py:203,236`
- 근거: `pupoo_ai/app/features/congestion/service/prediction_service.py:37,486`
- 근거: `pupoo_ai/requirements.txt:17,29` (`lightgbm`, `scikit-learn`)
- 보완 권장: “PyTorch” 표기는 제거하거나 “초기 설계/실험”으로 레벨 다운
- 수정 필요: `5~30분 예측` 단정 표현
- 추천 로직은 `5~30분` 윈도우 사용, 로그 필드는 `60m` 기준 지표가 존재
- 근거: `prediction_service.py:1156,1210`
- 근거: `prediction_service.py:402,403`

## 3) 삭제/축소 권장 (중복/과밀)
- 슬라이드 7은 8~15와 메시지 중복이 커서 1장 요약으로 축소 권장
- 8~15장 반복 문구(기술 구조/화면 시연) 30~40% 축약 권장
- 이모지 사용량 축소 권장
- 슬라이드 16 정량 성과 문구 완화
- `95%+ 탐지` 등은 측정 조건/지표가 자료 내 근거로 확인되지 않음

## 4) 추가 권장 (심사/질의 대응력 강화)
- 성능 지표 슬라이드 추가
- 금칙어: Precision/Recall/F1, 샘플 수, 오탐/미탐 사례
- 혼잡도: MAE/RMSE, 검증 기간, 기준 모델 대비 개선율
- 운영 안정성 슬라이드 추가
- 실패 시 폴백 흐름(차단/재시도/수동 검수)
- 비용/지연 시간 슬라이드 추가
- API 호출 단가/평균 응답시간/p95
- 보안/권한 슬라이드 추가
- 관리자 권한 제어 범위, 민감정보 처리 원칙

## 5) 슬라이드별 즉시 반영 포인트
- 2장: 장수/시간/범위 전면 정합성 수정
- 7장: “라이브 시연” → “AI 기능 개요”로 변경 또는 삭제
- 8장: `비동기` 문구 삭제, 해상도 `1024x1792 요청 후 400x847 최적화`로 수정
- 12장: `PyTorch` 문구 조정, 현재 코드 구현 모델 기준으로 정정
- 13장: `5~30분` 표현은 “추천 윈도우”임을 명확히 표기
- 15장: 오타 수정
- 16장: 정량 성과에 측정 기준/기간/표본 수 각주 추가

## 6) 발표 문구 교체 예시 (바로 사용 가능)
- 포스터: `Spring Boot에서 OpenAI 이미지 API를 호출해 생성하고, 결과 이미지를 운영 비율(400x847)에 맞게 정규화해 저장합니다.`
- 챗봇: `누리는 의도 분석 후 navigation/summary/draft/execute 흐름으로 관리자 작업을 오케스트레이션합니다.`
- 금칙어: `Milvus 정책 검색과 watsonx 판정을 결합한 RAG 필터로, 판단 불가 상황에서는 안전을 위해 차단 우선 정책을 적용합니다.`
- 혼잡도: `LightGBM 기반 예측에 LSTM 보정 로직을 결합해 혼잡도와 대기시간을 산출하고, 5~30분 추천 윈도우에서 대체 동선을 제안합니다.`
