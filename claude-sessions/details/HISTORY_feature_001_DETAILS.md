# HISTORY_feature_001 상세 기록

## 📅 세션 정보
- **날짜**: 2026-02-02
- **분류**: feature
- **저장 위치**: /root/Workspace/playground/finance-diary

---

## 🎯 최초 요구사항

사용자가 제공한 계획:
- 개인 재무관리 앱 (가계부 + 주식 투자 일기)
- 고점 대비 하락률 모니터링 (-10% 알림)
- 기술 스택: React + TypeScript + Vite + Tailwind + Recharts
- 데이터: Google Sheets API (선택) + localStorage
- 배포: GitHub Pages

### 핵심 기능 요구사항
1. 가계부 (수입/지출 CRUD)
2. 주식 매매 기록 + 일기
3. 포트폴리오 현황 + 고점 추적
4. 대시보드

---

## 🔧 구현 과정

### 1. 프로젝트 초기화

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss @tailwindcss/vite
npm install recharts react-router-dom
```

**vite.config.ts 수정:**
- Tailwind 플러그인 추가
- base: '/finance-diary/' (GitHub Pages용)

### 2. 타입 정의 (src/types/index.ts)

```typescript
// 주요 인터페이스
interface Transaction { id, date, type, category, amount, memo }
interface StockTrade { id, date, stockName, stockCode, tradeType, quantity, price, total, memo }
interface PortfolioHolding { stockName, stockCode, quantity, avgPrice, currentPrice, highPrice, dropFromHigh, profitRate }
interface Asset { id, name, type, amount, institution, memo, updatedAt }
interface Loan { id, name, type, principal, remainingBalance, interestRate, monthlyPayment, ... }
interface Installment { id, itemName, cardName, totalAmount, monthlyAmount, totalMonths, paidMonths, ... }
```

### 3. 서비스 구현

**googleSheets.ts:**
- GAPI + GIS 로드
- OAuth 인증 플로우
- CRUD 메서드 (getTransactions, addTransaction, etc.)

**yahooFinance.ts:**
- CORS 프록시 사용 (allorigins.win)
- formatStockCode(): 한국주식 .KS/.KQ 처리
- getQuote(), getHistoricalPrices()
- calculateHighWatermark(), calculateDropFromHigh()
- isAlertTriggered() (-10% 기본값)

### 4. 상태 관리 훅 (useFinanceData.ts)

```typescript
// 핵심 상태
const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
const [stockTrades, setStockTrades] = useLocalStorage<StockTrade[]>('stockTrades', []);
const [portfolio, setPortfolio] = useLocalStorage<PortfolioHolding[]>('portfolio', []);
const [assets, setAssets] = useLocalStorage<Asset[]>('assets', []);
const [loans, setLoans] = useLocalStorage<Loan[]>('loans', []);
const [installments, setInstallments] = useLocalStorage<Installment[]>('installments', []);

// 핵심 함수
addTransaction(), deleteTransaction()
addStockTrade(), deleteStockTrade()
refreshPrices() - Yahoo Finance에서 시세 갱신
getDropAlerts() - 고점 대비 -10% 이상 하락 종목
getSummary() - 월별 요약 계산
getTotalNetWorth() - 순자산 계산
```

### 5. 페이지 구현

| 페이지 | 파일 | 주요 기능 |
|--------|------|----------|
| 대시보드 | Dashboard.tsx | 요약 카드, 파이차트, 라인차트, 알림 |
| 가계부 | Transactions.tsx | 거래 목록, 필터, 추가 모달 |
| 자산 | Assets.tsx | 자산/대출/할부 탭, CRUD |
| 주식매매 | Stocks.tsx | 매매 기록, 투자 일기 |
| 포트폴리오 | Portfolio.tsx | 보유종목, 수익률, 고점 추적 |
| 설정 | Settings.tsx | 저장 방식, Google Sheets 연동 |

### 6. 테스트 설정

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**테스트 파일:**
- format.test.ts: formatKRW, formatPercent, getValueColor 등
- yahooFinance.test.ts: formatStockCode, calculateHighWatermark 등
- types.test.ts: 카테고리 상수 검증

**결과:** 34개 테스트 모두 통과

### 7. Git 및 배포

```bash
# Git 초기화 (fairy-tooth91 계정)
git init
git config --local user.name "fairy-tooth91"
git config --local user.email "woonyong0729@gmail.com"

# GitHub 레포 생성 (API)
curl -X POST https://api.github.com/user/repos -d '{"name":"finance-diary"}'

# 푸시
git remote add origin https://...@github.com/fairy-tooth91/finance-diary.git
git push -u origin master
git checkout -b develop
git push -u origin develop

# 배포
npm run deploy  # gh-pages 브랜치에 배포
```

---

## 📋 추가 요청사항 (v2)

### 사용자 요청
1. **자산 탭** 추가: 자산 + 대출 관리
2. **할부 기능** 추가

### 구현 내용

**Assets.tsx 페이지:**
- 3개 탭: 자산, 대출, 할부
- 순자산 = 총자산 + 투자자산 - 총대출
- 이번 달 할부금 표시

**할부 로직 (현재 구현):**
1. 할부 등록 시 → 첫 결제일에 가계부 지출 자동 기록
2. 다음 달 → "이번 달 결제 예정" 목록에 표시
3. 결제 당일 → 예정 목록에서 제외

⚠️ **사용자 피드백:** 할부 로직 이해가 잘못됨 - 재확인 필요

---

## 🤔 Claude 판단 과정

### 기술 선택 근거
1. **localStorage 기본값**: 사용자가 바로 사용 가능, Google Sheets는 설정 복잡
2. **CORS 프록시**: Yahoo Finance API가 CORS 차단, allorigins.win 무료 프록시 사용
3. **gh-pages 패키지**: GitHub Pages 배포 자동화

### 타입 오류 해결
- `verbatimModuleSyntax` 오류 → `import type` 사용
- Recharts Tooltip formatter 타입 → `value as number` 캐스팅
- 테스트 파일 빌드 제외 → tsconfig.app.json exclude 추가

---

## 📁 생성된 파일 목록

```
finance-diary/
├── CLAUDE.md
├── doc/
│   └── v0.1.md
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/common/
│   │   ├── Layout.tsx
│   │   └── Modal.tsx
│   ├── context/
│   │   └── FinanceContext.tsx
│   ├── hooks/
│   │   ├── useFinanceData.ts
│   │   └── useLocalStorage.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   ├── Assets.tsx
│   │   ├── Stocks.tsx
│   │   ├── Portfolio.tsx
│   │   └── Settings.tsx
│   ├── services/
│   │   ├── googleSheets.ts
│   │   └── yahooFinance.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── format.ts
│   └── test/
│       ├── setup.ts
│       ├── format.test.ts
│       ├── yahooFinance.test.ts
│       └── types.test.ts
├── public/
│   └── 404.html
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── package.json
```

---

## 🔗 외부 리소스

- **GitHub**: https://github.com/fairy-tooth91/finance-diary
- **배포**: https://fairy-tooth91.github.io/finance-diary/
- **Yahoo Finance API**: query1.finance.yahoo.com
- **CORS 프록시**: api.allorigins.win

---

## ⏭️ 다음 세션 TODO

1. 할부 로직 사용자 요구사항 재확인
2. 필요시 할부 로직 수정
3. 스마트폰 동기화 방안 결정 (Google Sheets vs Firebase)
4. PWA 변환 검토
