# HISTORY_feature_002 상세 기록

## 📅 세션 정보
- **날짜**: 2026-02-10 (컨텍스트 연속 세션)
- **분류**: feature
- **저장 위치**: /root/Workspace/playground/finance-diary

---

## 🎯 사용자 요청 흐름

### 세션 1 (이전 컨텍스트)
1. Supabase 마이그레이션 시작 → SQL 스키마, 서비스 레이어 구현
2. "너가 쿼리를 날려서 생성할 수는 없어?" → anon key로 DDL 불가 설명
3. "user 테이블을 참조해서 사용할 수 있도록" → users 테이블 + FK 구조로 변경
4. "프로젝트 파일에 다른 프로젝트에 해둔거처럼 dbtables 해서 추적관찰 가능하게" → db/init/*.sql 생성
5. "스키마는 public으로 해야해?" → public 스키마 확인
6. "대시보드에서 어떤것들을 보는게 유용하다 생각해?" → 시장 지표 제안
7. "무조건 수용하지말고 제대로 생각해서 말해줘" → 대시보드 편집 기능 불필요, 금/은 투자 안 하면 과도하다고 피드백
8. "코스피 + 나스닥, 원/달러, 원/엔 + 금" → 시장 지표 구현

### 세션 2 (현재 - 컨텍스트 연속)
9. "금정도는 krx 시세로 알려주라" → COMEX×환율로 KRW/g 환산 구현
10. "NaN은 뭔대" → chartPreviousClose 필드명 이슈 발견
11. "장마감되서 그런거야?" → curl로 실제 API 응답 확인하여 진단
12. "커밋 하고 배포 하고 세션 저장" → 3건 커밋 + push + deploy

---

## 🔧 구현 상세

### 1. DB 스키마 (db/init/)

**실행 순서가 중요** (FK 의존성):
```
1.tables.users.sql         → 기본 테이블
2.tables.assets.sql        → users FK
2.tables.cards.sql         → users FK
2.tables.loans.sql         → users FK
2.tables.stock_trades.sql  → users FK
2.tables.portfolio.sql     → users FK (복합 PK: stock_code + user_id)
2.tables.price_history.sql → users FK (UNIQUE: user_id + date + stock_code)
3.tables.transactions.sql  → users FK + cards FK
3.tables.installments.sql  → users FK + cards FK
```

**기본 사용자 INSERT:**
```sql
INSERT INTO public.users (id, email, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'default@finance-diary.local', '기본 사용자')
ON CONFLICT (id) DO NOTHING;
```

### 2. Supabase 서비스 레이어 (src/services/supabase.ts)

**매핑 패턴:**
```typescript
// DB → TS (snake_case → camelCase)
function toTransaction(row): Transaction {
  return { id: row.id, paymentMethod: row.payment_method, cardId: row.card_id, ... };
}

// TS → DB (camelCase → snake_case)
function fromTransaction(tx) {
  return { user_id: getCurrentUserId(), payment_method: tx.paymentMethod, ... };
}
```

**모든 쿼리에 user_id 필터:**
```typescript
const { data } = await supabase.from('transactions')
  .select('*')
  .eq('user_id', getCurrentUserId())
  .order('date', { ascending: false });
```

### 3. 시장 지표 (src/services/yahooFinance.ts)

**MarketIndicator 인터페이스:**
```typescript
export interface MarketIndicator {
  symbol: string;      // '^KS11', 'GOLD_KRW' 등
  label: string;       // '코스피', '금(KRX)'
  unit: string;        // '', '원', '원/g'
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
}
```

**getMarketIndicators() 로직:**
1. 5개 심볼 병렬 조회: ^KS11, ^IXIC, USDKRW=X, JPYKRW=X, GC=F
2. 기본 4개는 직접 계산 (JPY는 ×100)
3. 금 시세는 별도 변환: `(GC=F 가격 × USDKRW) / 31.1035`
4. 전일종가도 전일환율 적용: `(전일금값 × 전일환율) / 31.1035`

### 4. chartPreviousClose 버그

**증상:** 코스피 등락률 0.00%, 변동금액 NaN

**원인:** Yahoo Finance chart API v8 응답에서 전일종가 필드명이 `previousClose`가 아니라 `chartPreviousClose`

**진단 과정:**
```bash
curl -s "https://api.allorigins.win/raw?url=..." | python3 -m json.tool
# 결과: "chartPreviousClose": 5298.04 (previousClose 필드 없음)
```

**수정:** `YahooChartResult.meta.previousClose` → `chartPreviousClose`
- 추가로 `?? price` fallback 유지 (혹시 없을 때 대비)

### 5. 카드/할부 리팩토링

**Card 타입 추가:**
```typescript
interface Card {
  id: string;
  name: string;           // "신한 Deep On"
  company: string;        // "신한카드"
  type: 'debit' | 'credit';
  billingDay?: number;    // 신용카드 결제일
  linkedAssetId?: string; // 연결 계좌
  memo: string;
}
```

**거래 추가 폼 분기:**
```
지출 → 결제수단 선택
├── 현금: 바로 거래 등록
└── 카드: 등록된 카드 선택
    ├── 체크/신용 일시불: 거래 등록 (cardId 포함)
    └── 신용 할부: 할부개월 입력 → installment 생성
```

---

## 🤔 Claude 판단 과정

### 대시보드 기능 의견 제시
사용자가 "무조건 수용하지말고 제대로 생각해서 말해줘"라고 요청:
- **대시보드 편집 기능**: 1인 사용 앱에서 과도한 엔지니어링으로 불필요하다고 피드백
- **금/은 가격**: 실제 투자하고 있지 않으면 불필요하다고 피드백
- **최종 합의**: 코스피+나스닥+환율 2종+금 = 5개 지표로 합의

### 금 시세 구현 방식
- KRX 금시장 직접 API: 유료/인증 필요 → 불가
- 대안: COMEX 금선물(GC=F) × USD/KRW 환율 ÷ 31.1035로 KRW/g 환산
- 라벨에 "금(KRX)" 표시하되, 실제로는 국제 참고 시세임을 인지

### Supabase DDL 제한
- publishable/anon key로는 PostgREST를 통한 DML만 가능
- DDL(CREATE TABLE)은 DB 비밀번호 또는 SQL Editor 필요
- 사용자가 직접 SQL Editor에서 실행하기로 결정

---

## 📁 변경된 파일 목록

### 생성
```
db/init/1.tables.users.sql
db/init/2.tables.assets.sql
db/init/2.tables.cards.sql
db/init/2.tables.loans.sql
db/init/2.tables.portfolio.sql
db/init/2.tables.price_history.sql
db/init/2.tables.stock_trades.sql
db/init/3.tables.installments.sql
db/init/3.tables.transactions.sql
src/services/supabase.ts
```

### 수정
```
package.json (+ @supabase/supabase-js)
package-lock.json
src/hooks/useFinanceData.ts (Supabase 연동)
src/pages/Assets.tsx (카드 탭 추가)
src/pages/Dashboard.tsx (시장 지표 섹션)
src/pages/Settings.tsx (Google Sheets → Supabase)
src/pages/Transactions.tsx (결제수단 분기, 할부 현황)
src/services/yahooFinance.ts (MarketIndicator, getMarketIndicators, chartPreviousClose)
src/types/index.ts (Card, paymentMethod/cardId 추가)
```

### 삭제
```
src/services/googleSheets.ts
```

---

## 📋 Git 커밋 내역

```
3bf18d9 대시보드 시장 지표 추가 (코스피, 나스닥, 환율, 금)
94a8c62 결제수단/카드/할부 통합 리팩토링
13fd581 Supabase 마이그레이션: localStorage → 클라우드 DB
```

---

## ⏭️ 다음 세션 TODO

1. Supabase SQL Editor에서 테이블 생성 확인 (사용자 직접)
2. 할부 로직 재검토 (이전 세션 피드백)
3. Phase 2 검토: 카드 결제일 자동 차감, 월별 카드 명세서 뷰
4. PWA 변환 검토
