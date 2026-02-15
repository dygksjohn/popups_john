# 🚀 POPUPS 팀원 개발 환경 세팅 가이드

## 1️⃣ 필수 설치

- Java 21
- MySQL 8.x
- Git
- STS4

---

## 2️⃣ 프로젝트 실행 방법

```bash
git clone <repository-url>
cd pupoo_workspace
./gradlew clean build
./gradlew bootRun
```

---

## 3️⃣ DB 설정

1.  MySQL에서 pupoodb 생성
2.  제공된 SQL 파일 import
3.  application.properties에서 DB 정보 확인

---

## 4️⃣ 작업 시작 전

```bash
git checkout develop
git pull origin develop
```

---

## 5️⃣ 작업 브랜치 생성 예시

```bash
git checkout -b feature/user-signup
```

---

## 🎯 중요 규칙

- main 직접 push 금지
- develop 직접 push 금지
- 반드시 PR로 병합
- 작업 전 develop 최신화 필수
