# Pupoo (Popups) — 이벤트 통합 플랫폼

행사·프로그램·참가·결제·실시간 운영·커뮤니티·갤러리·문의·알림을 하나의 서비스로 묶은 **B2C 이벤트 플랫폼**입니다.  
프론트엔드(React), 백엔드(Spring Boot), AI 서비스(FastAPI)가 분리되어 있으며, **AWS·Kubernetes** 기반으로 배포·운영할 수 있도록 구성되어 있습니다.

> 팀 프로젝트입니다. 아래 **「핵심 구현 및 문제 해결」**은 작성자 **dygksjohn** 기준으로 정리했습니다.

---

## 목차

- [주요 기능](#주요-기능)
- [저장소 구조](#저장소-구조)
- [기술 스택](#기술-스택)
- [핵심 구현 및 문제 해결 (dygksjohn)](#핵심-구현-및-문제-해결-dygksjohn)
- [정량 지표 (레포 기준)](#정량-지표-레포-기준)
- [문서](#문서)
- [실행·배포 안내](#실행배포-안내)

---

## 주요 기능

| 영역 | 내용 |
|------|------|
| 인증·회원 | 이메일/소셜 로그인, OTP, 마이페이지, 펫 프로필 |
| 행사·프로그램 | 행사/세션/부스/콘테스트, 신청, QR 체크인 |
| 결제·환불 | 결제·내역·환불 요청 및 관리자 처리 |
| 실시간·대시보드 | 행사별 현황, 대기·체크인·투표 집계 |
| 커뮤니티 | 공지, FAQ, QnA, 후기, 자유/정보 게시판, 댓글, 신고 |
| 운영·모더레이션 | 금지어·정책·검토 큐, AI 기반 텍스트 판정(RAG + LLM) 연동 |
| 갤러리·문의·알림 | 행사 갤러리, 1:1 문의, 알림함·관리자 발송 |
| 인프라 | EKS 배포, RDS·Redis·S3·SES/SNS 등 AWS 연계 |

상세 기능 목록은 `.cursor-docs/generated/project-features-and-ai-ideas.md`를 참고하세요.

---

## 저장소 구조

```
popups_john/
├── pupoo_frontend/   # React 18 + Vite
├── pupoo_backend/    # Spring Boot 3.x (Java 21)
├── pupoo_ai/         # FastAPI — 모더레이션·RAG·임베딩 등
├── k8s/              # Kubernetes 매니페스트
├── .github/          # GitHub Actions (CI/CD)
├── docs/             # 정책·가이드
└── .cursor-docs/     # 기술 정리·SQL 덤프·발표 자료 (내부 문서)
```

---

## 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| **Backend** | Java 21, Spring Boot 3.x, Spring Security, OAuth2, JPA, MySQL, Redis, JWT |
| **Frontend** | React 18, Vite, Redux Toolkit / Redux-Saga, Axios, Bootstrap, Tailwind, Sass |
| **AI** | Python 3.12, FastAPI, LangChain, langchain-ibm (watsonx), Milvus, 정책 문서 RAG |
| **Cloud** | AWS — EKS, ECR, RDS, S3, CloudFront, ALB, ACM, SES, SNS 등 |
| **IBM** | watsonx 기반 LLM 연동 (임베딩·모더레이션 파이프라인) |
| **DevOps** | Docker, Kubernetes, GitHub Actions |

AWS 서비스별 매핑은 `.cursor-docs/generated/프로젝트_AWS_기능_정리.md`에 정리되어 있습니다.

---

## 핵심 구현 및 문제 해결 (dygksjohn)

### AI 기반 모더레이션 시스템 구축 (RAG & LLM)

- **watsonx**와 **Milvus**를 활용한 정책 기반 금지어 판정 로직 구현.
- **BLOCK / PASS / REVIEW** 3단계 판정 흐름 설계 및 정책 JSON(`policy_docs`) 동적 인덱싱 파이프라인 최적화.

### 백엔드 도메인 고도화 및 API 설계

- 커뮤니티(Post, Reply, Review 등) 전반의 **Server-side 페이징·필터링·정렬** 로직 최적화.
- **FastAPI** 라우터 기반 AI 서비스의 **의존성 주입** 및 **비동기 처리** 구조 정리.

### 클라우드 네이티브 환경 운영 및 CI/CD

- **Kubernetes(K8s)** 환경의 시크릿 관리 및 DB 연결 설정 등 운영 환경 안정화.
- **GitHub Actions**를 이용한 자동화 테스트(**pytest**) 및 빌드 파이프라인(**Node**) 무결성 확보.

### 프론트엔드 UX/UI 개선 및 버그 대응

- 행사 **갤러리**, **현장 스케치** 모달 및 **이미지 업로드** 비동기 흐름 개선.
- 대용량 파일 제거 및 **레포지토리 히스토리** 정리를 통한 협업 환경 최적화.

---

## 정량 지표 (레포 기준)

소스·문서 스캔 기준이며, 브랜치·시점에 따라 소폭 달라질 수 있습니다.

| 항목 | 수치 |
|------|------|
| Spring HTTP 매핑(메서드) | 약 **276**개 |
| FastAPI 라우트(근사) | 약 **18**개 |
| 문서용 MySQL 테이블 덤프 | **58**개 (`.cursor-docs/sql/pupoodb_sql/`) |
| 본인 커밋 (예: `main` 기준) | 약 **107**개 — `git shortlog -sn --author=dygksjohn` |

---

## 문서

| 파일 | 설명 |
|------|------|
| `.cursor-docs/generated/프로젝트_기술스택_정리.md` | 스택 상세 |
| `.cursor-docs/generated/프로젝트_AWS_기능_정리.md` | AWS 연계 |
| `.cursor-docs/generated/project-features-and-ai-ideas.md` | 기능·AI 아이디어 |
| `.cursor-docs/generated/cursor-solution.md` | 모더레이션 RAG·Milvus·로깅·인덱싱 |
| `.cursor-docs/generated/MANUS_프로젝트_소스_전달.md` | 이력·AI 도구용 요약 복사본 |
| `k8s/README.md` | 클러스터 배포 개요 |

---

## 실행·배포 안내

- **프론트**: `pupoo_frontend/README.md`
- **백엔드**: `pupoo_backend` — Gradle 기반 (`./gradlew bootRun` 등, JDK 21)
- **AI**: `pupoo_ai/README.md` — FastAPI, `.env`·Milvus 등 선행 조건 확인
- **Kubernetes**: `k8s/README.md`

실제 DB·API 키·시크릿은 **커밋하지 않습니다.** 로컬용 템플릿은 저장소 내 예시 파일·문서를 따르세요.

---

## 원격 저장소

- `origin`: `https://github.com/dygksjohn/popups_john.git`

---

## 라이선스·문의

저장소 정책에 따릅니다. 포트폴리오·면접용 문의는 이력서에 기재된 연락처로 부탁드립니다.

---

### English (short)

**Pupoo** is a full-stack **event management platform**: registration, payments, realtime ops, community boards, gallery, inquiries, and notifications. Built with **React**, **Spring Boot**, and **FastAPI**, deployed on **AWS** (EKS, RDS, S3, etc.) with **watsonx**-powered moderation (RAG + Milvus). See module READMEs under `pupoo_frontend/`, `pupoo_backend`, `pupoo_ai`, and `k8s/`.
