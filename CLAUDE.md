# Finance Diary - 개인 재무관리 앱

> **Personal Project** — 이 프로젝트는 개인 사이드 프로젝트이며, 소속 회사(Ncurion/업무)와 무관합니다.

## 프로젝트 개요

가계부와 주식 투자 일기를 결합한 종합 재무관리 웹 앱

- **배포 URL**: https://finance-diary.vercel.app (Vercel 배포 후 확정)
- **GitHub**: https://github.com/fairy-tooth91/finance-diary
- **Supabase**: `afypqjipbjjdmzevsxow.supabase.co` (public 스키마)
- **호스팅**: Vercel

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 19 + TypeScript + Vite |
| UI | Tailwind CSS |
| 차트 | Recharts |
| 주가 API | Yahoo Finance (CORS 프록시: allorigins.win) |
| 시장 지표 | Yahoo Finance (코스피, 나스닥, 환율, 금) |
| 데이터 저장 | Supabase (PostgreSQL) |
| 인증 | Supabase Auth (Google, Kakao, Naver) |
| 배포 | Vercel |

## 아키텍처

### Service 패턴

`services/` 폴더가 Supabase를 포함한 모든 외부 의존성을 캡슐화한다.
도메인별로 독립된 파일이 CRUD 함수를 직접 export하는 구조.

```
Pages → FinanceContext → useFinanceData → services/*.ts → Supabase
```

### Service 레이어 격리 규칙 (반드시 준수)

1. **Supabase 클라이언트를 사용할 수 있는 파일은 `services/` 내부만 허용한다.**
2. **Context, Hook, Component, Page, Utils에서는 절대 Supabase를 직접 import하지 않는다.**
   - ❌ `import { supabase } from '../services/client'`
   - ✅ `import { fetchTransactions } from '../services'`
3. **snake_case ↔ camelCase 변환은 각 서비스 파일 내부 `toX()`/`fromX()` 함수에서만 처리한다.**
4. **새로운 DB 조회/수정이 필요하면 해당 도메인 서비스 파일에 함수를 추가한다.**

### 백엔드 교체 시나리오

서비스가 커져서 자체 백엔드(Go 등)가 필요해지면, `services/` 내부 구현만 `fetch()` 호출로 교체:
```
현재: services/transactions.ts → supabase.from('transactions')...
교체: services/transactions.ts → fetch('/api/transactions')
```
- 함수 시그니처(입출력 타입)는 동일하게 유지
- Hook/Context/Page는 수정 불필요

## 폴더 구조

```
src/
├── services/                  # ★ 데이터/인증 계층 (Supabase 의존, 교체 대상)
│   ├── client.ts              #   Supabase 클라이언트 초기화
│   ├── auth.ts                #   인증 (소셜 로그인/로그아웃/세션)
│   ├── transactions.ts        #   수입/지출 CRUD
│   ├── assets.ts              #   자산 CRUD
│   ├── loans.ts               #   대출 CRUD
│   ├── cards.ts               #   카드 CRUD
│   ├── installments.ts        #   할부 CRUD
│   ├── stockTrades.ts         #   주식 매매 CRUD
│   ├── portfolio.ts           #   포트폴리오 upsert/삭제
│   ├── priceHistory.ts        #   가격 이력 upsert
│   ├── connection.ts          #   DB 연결 테스트
│   ├── yahooFinance.ts        #   Yahoo Finance API (시세 + 시장 지표)
│   └── index.ts               #   re-export (단일 진입점)
├── components/
│   └── common/
│       ├── Layout.tsx          #   헤더 + 6탭 네비게이션 + 로그아웃
│       └── Modal.tsx           #   공통 모달 컴포넌트
├── context/
│   ├── AuthContext.tsx         #   인증 상태 관리
│   └── FinanceContext.tsx      #   재무 데이터 상태 (useFinanceData 래핑)
├── hooks/
│   ├── useFinanceData.ts      #   비즈니스 로직 + CRUD (services 소비)
│   └── useLocalStorage.ts     #   localStorage 훅 (캐시용)
├── pages/
│   ├── Login.tsx              #   소셜 로그인 (Google, Kakao, Naver)
│   ├── Dashboard.tsx          #   시장 지표 + 월별 요약 + 차트
│   ├── Transactions.tsx       #   수입/지출 CRUD + 결제수단/할부
│   ├── Assets.tsx             #   자산/대출/카드/할부 4탭
│   ├── Stocks.tsx             #   매수/매도 기록 + 투자 일기
│   ├── Portfolio.tsx          #   보유 종목 + 수익률 + 시세 차트
│   └── Settings.tsx           #   연결 상태 + 캐시 관리
├── types/
│   └── index.ts               #   TypeScript 인터페이스 + 상수
└── utils/
    └── format.ts              #   통화/날짜 포맷 유틸리티

db/init/                       # DB 스키마 SQL (실행 순서: 1→2→3)
docs/
├── architecture.md            # 전체 아키텍처 + 데이터 흐름도
├── api-spec.md                # 데이터 계약 (엔티티, 서비스 함수)
└── adr/                       # Architecture Decision Records
    ├── 001-supabase-direct.md
    ├── 002-repository-pattern.md  → 003에 의해 대체됨
    ├── 003-auth-supabase-first.md
    └── 004-service-pattern.md
```

## 코딩 컨벤션

### DB ↔ TypeScript 매핑
- **DB**: snake_case (`payment_method`, `card_id`, `billing_day`)
- **TypeScript**: camelCase (`paymentMethod`, `cardId`, `billingDay`)
- 각 서비스 파일 내부 `toX()`/`fromX()` 매핑 함수로 변환 (export하지 않음)

### 환경 변수
- `.env` 파일에 Supabase 키 보관 (소스코드에 하드코딩 금지)
- Vite 환경 변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- 접근: `import.meta.env.VITE_SUPABASE_URL`

### 데이터 스코프
- finance-diary: `user_id` 기준 (개인 앱)
- 모든 데이터는 `user_id`로 필터링
- 서비스 함수 첫 번째 인자로 `userId` 전달

### Optimistic UI
- UI 즉시 업데이트 → Supabase 백그라운드 동기화
- 실패 시 롤백 + 에러 표시

## 구현된 기능

### 1. 대시보드 (`/`)

- **시장 지표 5종** (실시간)
  - 코스피 (^KS11), 나스닥 (^IXIC)
  - USD/KRW (1달러당), JPY100/KRW (100엔당)
  - 금(KRX) - COMEX 선물 × USD/KRW ÷ 31.1035 (KRW/g)
  - 전일 종가 대비 등락률/등락폭 (한국식: 상승 빨강, 하락 파랑)
- 이번 달 수입/지출/순수익 요약
- 총 투자자산 + 수익률
- 고점 대비 -10% 하락 종목 알림
- 카테고리별 지출 파이 차트
- 최근 수입/지출 추이 라인 차트
- 포트폴리오 현황 테이블

### 2. 가계부 (`/transactions`)

- 수입/지출 CRUD
- **결제수단 분기**: 현금 / 카드 선택
  - 카드 선택 시 등록된 카드 목록에서 선택
  - 신용카드 할부: 할부개월 입력 → Installment 자동 생성
- **월별 할부 결제 현황**: 해당 월 할부 회차, 잔여금, 완납 표시
- 카테고리 분류 (식비, 교통, 쇼핑, 주거/통신, 문화/여가, 의료/건강, 교육, 기타)
- 월별/유형별 필터링

### 3. 자산 (`/assets`)

4개 탭: **자산 | 대출 | 카드 | 할부**

- **자산 탭**: 현금, 예적금, 투자자산, 부동산, 기타
- **대출 탭**: 주택담보, 신용, 개인, 기타 + 원금/잔액/이자율/월상환
- **카드 탭**: 카드 등록 (카드명, 카드사, 체크/신용, 결제일, 연결계좌)
- **할부 탭**: 진행 중 할부 조회/삭제 (등록은 가계부에서)
- **순자산 = 자산 + 투자 - 대출 - 할부잔여**

### 4. 주식매매 (`/stocks`)

- 매수/매도 기록, 투자 일기 (메모)
- 종목명, 종목코드, 수량, 단가, 총액 자동 계산

### 5. 포트폴리오 (`/portfolio`)

- 보유 종목, 수익률, 고점 추적 (3개월 High Watermark)
- -10% 이상 하락 시 경고
- Yahoo Finance API로 시세 갱신
- 종목 클릭 시 가격 추이 차트

### 6. 설정 (`/settings`)

- Supabase 연결 상태 표시 (연결됨/로딩/오류)
- 로컬 캐시 삭제

## 데이터 구조

### DB 스키마
- 모든 테이블에 `user_id UUID FK → users(id)`
- 기본 사용자: `00000000-0000-0000-0000-000000000001`
- snake_case (DB) ↔ camelCase (TypeScript) 자동 매핑

### 주요 타입
```typescript
interface Transaction {
  id: string; date: string; type: 'income' | 'expense';
  category: string; amount: number; memo: string;
  paymentMethod?: 'cash' | 'card';  // 지출일 때만
  cardId?: string;                   // 카드 결제 시
  installmentId?: string;            // 할부 연결
}

interface Card {
  id: string; name: string; company: string;
  type: 'debit' | 'credit';
  billingDay?: number;      // 신용카드 결제일
  linkedAssetId?: string;   // 연결 계좌
  memo: string;
}

interface Installment {
  id: string; itemName: string; cardId: string; cardName: string;
  category: string; totalAmount: number; monthlyAmount: number;
  totalMonths: number; paidMonths: number;
  startDate: string; paymentDay: number; memo: string;
}
```

## 브랜치 전략

- `master`: 안정 버전 (Vercel 자동 배포)
- `develop`: 개발 브랜치 (현재 작업 중)

## 명령어

```bash
npm run dev       # 개발 서버
npm run build     # 프로덕션 빌드
npm run test      # 테스트 실행
```

## TODO

- [ ] 할부 로직 재검토
- [ ] Phase 2: 카드 결제일 자동 차감, 월별 카드 명세서 뷰
- [ ] PWA 변환 검토
- [ ] 자체 백엔드(Go) 전환 시 services/ 내부를 fetch() 호출로 교체
- [x] 인증 시스템 도입 (Supabase Auth: Google/Kakao/Naver)
- [x] Vercel 배포 마이그레이션
- [ ] 투자 일기 기능 강화 (매매 복기, 감정 태그)
- [ ] Vercel에 Supabase 환경변수 설정 + 실배포
