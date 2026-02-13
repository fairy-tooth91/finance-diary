# ADR-004: Repository 패턴 → Service 패턴 전환

## 상태
**채택됨** — 2026-02-13 (ADR-002 대체)

## 맥락
ADR-002에서 Repository 패턴(인터페이스 + 구현체 + 팩토리)을 도입했으나, 다음과 같은 문제가 있었다:

1. **과도한 추상화**: 인터페이스, 구현체, 팩토리 3개 파일이 하나의 역할을 위해 존재
2. **실질적 이점 부족**: 현재 구현체는 Supabase 하나뿐이며, Mock이나 FetchRepository 계획이 없음
3. **개발자 경험**: Go 백엔드 개발자 관점에서 프론트엔드에 Repository 인터페이스가 불필요하게 복잡
4. **핵심 인사이트**: 자체 백엔드가 필요한 시점이 오면, Go 서버를 만들고 프론트엔드는 단순히 `fetch()` 호출로 전환하면 됨. 프론트엔드에 TypeScript 인터페이스로 계약을 정의할 필요가 없음.

## 결정
Repository 패턴을 제거하고, pennypair 프로젝트와 동일한 Service 패턴으로 전환했다.

## 구조
```
src/services/
├── client.ts              # Supabase 클라이언트 초기화
├── auth.ts                # 인증 (소셜 로그인/로그아웃)
├── transactions.ts        # 수입/지출 CRUD
├── assets.ts              # 자산 CRUD
├── loans.ts               # 대출 CRUD
├── cards.ts               # 카드 CRUD
├── installments.ts        # 할부 CRUD
├── stockTrades.ts         # 주식 매매 CRUD
├── portfolio.ts           # 포트폴리오 upsert/삭제
├── priceHistory.ts        # 가격 이력 upsert
├── connection.ts          # DB 연결 테스트
├── yahooFinance.ts        # Yahoo Finance API
└── index.ts               # re-export
```

### 설계 원칙
- 도메인별 독립 파일, 각 파일이 함수를 직접 export
- 인터페이스/팩토리 없음 — 단순한 함수 호출
- snake_case ↔ camelCase 매핑은 각 파일 내부 `toX()`/`fromX()` 함수에서 처리
- `services/` 외부에서는 Supabase 클라이언트를 직접 import하지 않음

### 사용 방식
```typescript
// 이전 (Repository 패턴)
import { getRepository } from '../repository';
const repo = getRepository(userId);
await repo.transactions.getAll();

// 이후 (Service 패턴)
import { fetchTransactions } from '../services';
await fetchTransactions(userId);
```

## 삭제된 파일
- `src/repository/types.ts` — DataRepository 인터페이스
- `src/repository/supabase.ts` — Supabase 구현체
- `src/repository/index.ts` — 팩토리
- `src/auth/types.ts` — AuthProvider 인터페이스
- `src/auth/supabase.ts` — Supabase Auth 구현체
- `src/auth/index.ts` — Auth 팩토리
- `src/lib/supabase.ts` — 공유 Supabase 클라이언트

## 결과
- **코드 간소화**: 인터페이스/팩토리 제거로 파일 수 감소, 구조 단순화
- **가독성 향상**: import → 함수 호출로 직관적
- **백엔드 교체 가능성 유지**: `services/` 내부 구현만 `fetch()`로 변경하면 됨
- **두 프로젝트 일관성**: pennypair와 동일한 패턴으로 학습 비용 감소
