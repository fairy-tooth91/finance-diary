# Architecture Overview

## 시스템 구성도

```
┌────────────────────────────────────────────────────────────┐
│                     Client (React SPA)                      │
│                                                            │
│  ┌─────────┐  ┌─────────────┐                              │
│  │  Login   │  │ AuthContext  │  ← services/auth.ts         │
│  │  Page    │──▶│ (인증 상태) │                              │
│  └─────────┘  └──────┬──────┘                              │
│                       │ user.id                             │
│  ┌─────────┐  ┌──────▼───────┐  ┌──────────────────┐      │
│  │  Pages   │──▶│FinanceContext│──▶│  useFinanceData  │      │
│  │(6 pages) │  │ (전역 상태)  │  │  (비즈니스 로직) │      │
│  └─────────┘  └──────────────┘  └────────┬─────────┘      │
│                                           │                 │
│                                  ┌────────▼─────────┐      │
│                                  │   services/*.ts   │      │
│                                  │  (도메인별 CRUD)  │      │
│                                  └────────┬─────────┘      │
│                                           │                 │
└───────────────────────────────────────────┼─────────────────┘
                                            │
                                   ┌────────▼──────┐
                                   │   Supabase    │
                                   │ (PostgreSQL)  │
                                   └───────────────┘
```

## 레이어 구조

### 0. Auth (인증)
- **위치**: `src/services/auth.ts`, `src/context/AuthContext.tsx`
- **역할**: 소셜 로그인/로그아웃, 인증 상태 관리
- **구조**:
  - `services/auth.ts` — 로그인/로그아웃/세션 함수 (Supabase Auth 사용)
  - `context/AuthContext.tsx` — React Context로 인증 상태 전파
- **함수**: `loginWithSocial()`, `logout()`, `getCurrentUser()`, `onAuthStateChange()`

### 1. Presentation Layer (Pages)
- **위치**: `src/pages/`
- **역할**: UI 렌더링, 사용자 입력 처리
- **의존성**: `useFinance()` 훅을 통해 데이터 접근
- **원칙**: 비즈니스 로직 없음, 순수 UI

### 2. State Management Layer (Context + Hook)
- **위치**: `src/context/FinanceContext.tsx`, `src/hooks/useFinanceData.ts`
- **역할**: 전역 상태 관리, 비즈니스 로직 (포트폴리오 계산, 요약 등)
- **의존성**: `services/` 함수를 직접 호출
- **원칙**: Supabase 등 외부 라이브러리를 직접 import하지 않음

### 3. Service Layer (Data Access)
- **위치**: `src/services/`
- **역할**: 데이터 CRUD, snake_case ↔ camelCase 매핑, 인증, 외부 API
- **구조**: 도메인별 독립 파일, 각 파일이 함수를 직접 export
- **파일**:
  - `client.ts` — Supabase 클라이언트 초기화
  - `auth.ts` — 인증 (소셜 로그인/로그아웃)
  - `transactions.ts` — 수입/지출 CRUD
  - `assets.ts` — 자산 CRUD
  - `loans.ts` — 대출 CRUD
  - `cards.ts` — 카드 CRUD
  - `installments.ts` — 할부 CRUD
  - `stockTrades.ts` — 주식 매매 CRUD
  - `portfolio.ts` — 포트폴리오 upsert/삭제
  - `priceHistory.ts` — 가격 이력 upsert
  - `connection.ts` — DB 연결 테스트
  - `yahooFinance.ts` — Yahoo Finance API (주가, 시장 지표)
  - `index.ts` — re-export (단일 진입점)

### 4. External Services
- **Yahoo Finance**: `src/services/yahooFinance.ts` (주가 조회, 시장 지표)
- **Supabase**: Service 레이어를 통해 간접 접근

## 데이터 흐름

### 읽기 (Read)
```
Page → useFinance() → useFinanceData → fetchTransactions(userId) → Supabase → DB
                                                                          ↓
Page ← useFinance() ← useState ←────── toTransaction(row) ←──── 응답 데이터
```

### 쓰기 (Write) — Optimistic Update
```
Page → useFinance().addTransaction(data)
         ↓
    1. setState([...prev, newTx])            ← UI 즉시 반영
    2. createTransaction(userId, newTx)      ← 백그라운드 동기화
         ↓
    성공: 완료 / 실패: console.error (추후 롤백 로직 추가 예정)
```

## 백엔드 교체 전략

서비스가 커져서 자체 백엔드(Go 등)가 필요해지면:

### 교체 방법
각 서비스 파일 내부의 Supabase 호출을 `fetch()` 호출로 변경:

```typescript
// 현재: services/transactions.ts
export async function fetchTransactions(userId: string) {
  const { data, error } = await supabase.from('transactions')...
  return data.map(toTransaction);
}

// 교체 후: services/transactions.ts
export async function fetchTransactions(userId: string) {
  const res = await fetch('/api/transactions', { headers: authHeader() });
  return res.json();
}
```

### 변경 범위
- `src/services/*.ts` — 내부 구현만 변경
- **함수 시그니처(입출력 타입)는 동일하게 유지**
- **Hook/Context/Page: 변경 없음**

## 폴더 구조

```
src/
├── services/                  # 데이터/인증 계층 (Supabase 의존)
│   ├── client.ts              #   Supabase 클라이언트
│   ├── auth.ts                #   인증
│   ├── transactions.ts        #   수입/지출
│   ├── assets.ts              #   자산
│   ├── loans.ts               #   대출
│   ├── cards.ts               #   카드
│   ├── installments.ts        #   할부
│   ├── stockTrades.ts         #   주식 매매
│   ├── portfolio.ts           #   포트폴리오
│   ├── priceHistory.ts        #   가격 이력
│   ├── connection.ts          #   연결 테스트
│   ├── yahooFinance.ts        #   Yahoo Finance API
│   └── index.ts               #   re-export
├── components/common/         # 공통 UI 컴포넌트
├── context/                   # React Context (Auth + Finance)
├── hooks/                     # 비즈니스 로직 훅
├── pages/                     # 페이지 컴포넌트 (6개 + Login)
├── types/                     # TypeScript 타입 정의
└── utils/                     # 유틸리티 함수
```
