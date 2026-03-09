# 🌿 Git 브랜치 전략 (POPUPS 프로젝트 기준)

## 📌 기본 브랜치

  브랜치      역할
  ----------- -----------------------------------
  `main`      배포 안정 브랜치 (운영 기준)
  `develop`   통합 개발 브랜치 (기능 병합 대상)

------------------------------------------------------------------------

# 🧱 작업 브랜치 규칙

## 1️⃣ feature/ --- 새로운 기능 개발

-   생성 기준: `develop`
-   병합 대상: `develop`

### 예시

``` bash
git checkout develop
git pull origin develop
git checkout -b feature/login
```

PR:

    feature/login → develop

------------------------------------------------------------------------

## 2️⃣ bugfix/ --- 일반 버그 수정

-   생성 기준: `develop`
-   병합 대상: `develop`

### 예시

``` bash
git checkout develop
git checkout -b bugfix/jwt-error
```

PR:

    bugfix/jwt-error → develop

------------------------------------------------------------------------

## 3️⃣ refactor/ --- 코드 구조 개선

-   생성 기준: `develop`
-   병합 대상: `develop`

### 예시

``` bash
git checkout develop
git checkout -b refactor/token-structure
```

PR:

    refactor/token-structure → develop

------------------------------------------------------------------------

## 4️⃣ hotfix/ --- 긴급 수정 (운영 문제 대응)

-   생성 기준: `main`
-   병합 대상: `main`
-   병합 후 반드시 `develop`에도 반영

### 예시

``` bash
git checkout main
git checkout -b hotfix/security-patch
```

PR:

    hotfix/security-patch → main

그 후:

``` bash
git checkout develop
git merge main
```

------------------------------------------------------------------------

# 🔄 전체 작업 흐름

    feature/*  bugfix/*    →  develop  →  main
    refactor/* /

    hotfix/*   →  main  →  develop

------------------------------------------------------------------------

# 📋 팀 공통 규칙

-   ❗ main / develop 직접 push 금지
-   ❗ 반드시 Pull Request로 병합
-   ❗ 최소 1명 approval 후 merge
-   ❗ 작업 전 develop 최신 pull 필수

``` bash
git checkout develop
git pull origin develop
```

------------------------------------------------------------------------

# 🧠 네이밍 규칙 예시

  유형       예시
  ---------- -----------------------------------
  기능       `feature/user-signup`
  기능       `feature/event-registration-api`
  버그       `bugfix/token-expired-exception`
  리팩토링   `refactor/auth-structure-cleanup`
  핫픽스     `hotfix/payment-critical-error`

------------------------------------------------------------------------

# 🎯 목표

-   main = 항상 배포 가능 상태 유지
-   develop = 기능 통합 안정 상태 유지
-   작업 브랜치는 짧게 유지 (1기능 1브랜치)
