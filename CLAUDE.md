# Finance Diary - 개인 재무관리 앱

## 프로젝트 개요

가계부와 주식 투자 일기를 결합한 종합 재무관리 웹 앱

- **배포 URL**: https://fairy-tooth91.github.io/finance-diary/
- **GitHub**: https://github.com/fairy-tooth91/finance-diary
- **Supabase**: `afypqjipbjjdmzevsxow.supabase.co` (public 스키마)

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 19 + TypeScript + Vite |
| UI | Tailwind CSS |
| 차트 | Recharts |
| 주가 API | Yahoo Finance (CORS 프록시: allorigins.win) |
| 시장 지표 | Yahoo Finance (코스피, 나스닥, 환율, 금) |
| 데이터 저장 | Supabase (PostgreSQL) |
| 배포 | GitHub Pages |

## 폴더 구조

```
src/
├── components/
│   └── common/
│       ├── Layout.tsx        # 전체 레이아웃 + 네비게이션
│       └── Modal.tsx         # 공통 모달 컴포넌트
├── context/
│   └── FinanceContext.tsx    # 전역 상태 관리
├── hooks/
│   ├── useFinanceData.ts     # 핵심 비즈니스 로직 (Supabase 연동)
│   └── useLocalStorage.ts    # localStorage 훅 (캐시용)
├── pages/
│   ├── Dashboard.tsx         # 대시보드 + 시장 지표
│   ├── Transactions.tsx      # 가계부 + 결제수단 + 할부 현황
│   ├── Assets.tsx            # 자산/대출/카드/할부
│   ├── Stocks.tsx            # 주식매매 기록
│   ├── Portfolio.tsx         # 포트폴리오 현황
│   └── Settings.tsx          # Supabase 연결 상태
├── services/
│   ├── supabase.ts           # Supabase CRUD + snake_case↔camelCase 매핑
│   └── yahooFinance.ts       # Yahoo Finance API + 시장 지표
├── types/
│   └── index.ts              # TypeScript 타입 정의
└── utils/
    └── format.ts             # 포맷팅 유틸리티

db/
└── init/                     # DB 스키마 SQL (실행 순서: 1→2→3)
    ├── 1.tables.users.sql
    ├── 2.tables.assets.sql
    ├── 2.tables.cards.sql
    ├── 2.tables.loans.sql
    ├── 2.tables.portfolio.sql
    ├── 2.tables.price_history.sql
    ├── 2.tables.stock_trades.sql
    ├── 3.tables.installments.sql
    └── 3.tables.transactions.sql
```

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

- `master`: 안정 버전
- `develop`: 개발 브랜치 (현재 작업 중)
- `gh-pages`: GitHub Pages 배포 브랜치 (자동 생성)

## 명령어

```bash
npm run dev       # 개발 서버
npm run build     # 프로덕션 빌드
npm run test      # 테스트 실행
npx gh-pages -d dist  # GitHub Pages 배포
```

## TODO

- [ ] 할부 로직 재검토
- [ ] Phase 2: 카드 결제일 자동 차감, 월별 카드 명세서 뷰
- [ ] PWA 변환 검토
