# HISTORY_feature_003 상세 기록

## 📅 세션 정보
- **날짜**: 2026-02-13 (컨텍스트 연속 세션 2회)
- **분류**: feature
- **저장 위치**: /root/Workspace/playground/finance-diary

---

## 🎯 사용자 요청 흐름

### 세션 1 (이전 컨텍스트 — 요약에서 복원)
1. Vercel 마이그레이션 진행 → 환경 변수, SPA 라우팅, 배포 설정
2. "pennypair CLAUDE.md를 참고해서 백엔드 분리 가능성을 명시해줘" → CLAUDE.md 대폭 업데이트
3. "service랑 repository랑 무슨 차이가 있는거야" → Service(함수 기반) vs Repository(인터페이스+구현체) 설명
4. "이 프로젝트에서 백엔드 로직은 어디에 있어?" → Supabase BaaS라 별도 백엔드 없음 설명
5. "나는 Go 백엔드 개발자인데 이 구조가 어색해" → Service 패턴으로 리팩토링 제안
6. "repository에서 service 형태로 변경되는거야?" → 확인
7. "백엔드 이식이나 안정성 비교" → Repository가 타입 안전성 약간 우위, 하지만 현재 규모에서 Service 충분
8. **핵심 인사이트**: "repository가 필요할 정도면 Go 백엔드 만들 시점이고, 그때 프론트는 fetch()만 하면 됨"
9. → 리팩토링 진행 승인

### 세션 2 (현재 — 컨텍스트 연속)
10. 구 파일 삭제 (repository/, auth/, lib/, services/supabase.ts)
11. CLAUDE.md + docs 업데이트 (architecture.md, api-spec.md, ADR-004)
12. 빌드 + 테스트 검증 → 성공
13. "원래 하려던 작업에서 남은 게 뭐였지?" → 전부 완료, TODO 목록 안내
14. "세션 저장하고 커밋하고 클리어" → 현재 작업

---

## 🔧 구현 상세

### 1. Vercel 마이그레이션

**vercel.json:**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**환경 변수 전환 (src/lib/supabase.ts → services/client.ts):**
```typescript
// 이전: 하드코딩
const supabaseUrl = 'https://afypqjipbjjdmzevsxow.supabase.co';

// 이후: 환경 변수
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}
```

**제거된 GitHub Pages 아티팩트:**
- `public/404.html` (SPA redirect hack)
- `basename="/finance-diary"` (App.tsx)
- `base: '/finance-diary/'` (vite.config.ts)
- GitHub Pages SPA routing hack (main.tsx)

### 2. 인증 시스템

**services/auth.ts 주요 함수:**
```typescript
export type SocialProvider = 'google' | 'kakao' | 'naver';
export interface AuthUser { id: string; email: string; name: string; avatarUrl?: string; }

export async function loginWithSocial(provider: SocialProvider): Promise<void>
export async function logout(): Promise<void>
export async function getCurrentUser(): Promise<AuthUser | null>
export function onAuthStateChange(cb: (user: AuthUser | null) => void): () => void
```

**ensureUserRecord() — 첫 로그인 시 users 테이블 upsert:**
```typescript
async function ensureUserRecord(user: AuthUser) {
  await supabase.from('users').upsert({
    id: user.id, email: user.email, name: user.name
  }, { onConflict: 'id' });
}
```

**OAuth redirect URL:**
```typescript
redirectTo: window.location.origin + '/'  // 동적 — Vercel/로컬 모두 대응
```

### 3. Repository → Service 패턴 전환

**각 서비스 파일 내부 구조 (예: cards.ts):**
```typescript
import { supabase } from './client';
import type { Card } from '../types';

// DB → TS 매핑 (내부 전용)
function toCard(row: Record<string, unknown>): Card { ... }
// TS → DB 매핑 (내부 전용)
function fromCard(c: Card, userId: string) { ... }
// 부분 업데이트 매핑 (내부 전용)
function cardUpdatesToDb(updates: Partial<Card>) { ... }

// 외부 export 함수
export async function fetchCards(userId: string): Promise<Card[]> { ... }
export async function createCard(userId: string, card: Card): Promise<Card> { ... }
export async function updateCard(id: string, updates: Partial<Card>): Promise<void> { ... }
export async function deleteCard(id: string): Promise<void> { ... }
```

**useFinanceData.ts 변경 핵심:**
```typescript
// 이전 (Repository)
import { getRepository } from '../repository';
const repo = useMemo(() => getRepository(userId), [userId]);
await repo.transactions.getAll();

// 이후 (Service)
import { fetchTransactions, createTransaction as createTransactionSvc } from '../services';
const uid = useMemo(() => userId || DEFAULT_USER_ID, [userId]);
await fetchTransactions(uid);
```

**import 충돌 해결 패턴:**
```typescript
// 서비스 함수와 훅 반환값 함수명이 겹치는 문제
import { deleteTransaction as deleteTransactionSvc } from '../services';

// 훅 내부에서 래핑
const removeTransaction = async (id: string) => {
  setTransactions(prev => prev.filter(t => t.id !== id));
  await deleteTransactionSvc(id);
};

// 반환값에서 원래 이름으로 매핑
return { deleteTransaction: removeTransaction };
```

### 4. 문서 업데이트

**ADR-004 핵심 내용:**
- ADR-002(Repository) 대체
- 전환 이유: 과도한 추상화, Go 개발자 관점, 실질적 이점 부족
- 결과: 코드 간소화, 가독성 향상, pennypair와 일관성

**CLAUDE.md 주요 변경:**
- "Repository 레이어 격리 규칙" → "Service 레이어 격리 규칙"
- 폴더 구조: auth/, lib/, repository/ 제거 → services/ 통합
- 아키텍처 흐름도 업데이트

---

## 🤔 Claude 판단 과정

### Repository vs Service 의견 제시
사용자가 "백엔드 이식이나 안정성 비교"를 요청:
- **Repository 장점**: 타입 안전성(인터페이스 계약), Mock 주입 가능
- **Service 장점**: 구조 단순, 직관적, Go 패키지 패턴과 유사
- **결론**: 현재 규모(BaaS + 1인 사용)에서 Service가 적합. Repository가 필요한 시점은 자체 백엔드가 필요한 시점이며, 그때는 프론트엔드에 인터페이스를 유지할 이유가 없음.

### 컨텍스트 연속 대응
이전 세션 요약에서 복원하여 작업 연속성 유지. "File has not been read yet" 에러를 2번 만났으나 Read 후 재시도로 해결.

---

## 📁 변경된 파일 목록

### 생성
```
vercel.json
.env
src/services/client.ts
src/services/auth.ts
src/services/transactions.ts
src/services/assets.ts
src/services/loans.ts
src/services/cards.ts
src/services/installments.ts
src/services/stockTrades.ts
src/services/portfolio.ts
src/services/priceHistory.ts
src/services/connection.ts
src/services/index.ts
src/context/AuthContext.tsx
src/pages/Login.tsx
docs/adr/004-service-pattern.md
```

### 수정
```
.gitignore (+ .env entries)
src/App.tsx (basename 제거)
src/main.tsx (SPA hack 제거)
src/hooks/useFinanceData.ts (repository → services)
src/context/FinanceContext.tsx
src/components/common/Layout.tsx
vite.config.ts (base 제거)
CLAUDE.md (Service 패턴 아키텍처로 전면 수정)
docs/architecture.md (전면 재작성)
docs/api-spec.md (Repository → Service Functions)
```

### 삭제
```
public/404.html
src/repository/types.ts
src/repository/supabase.ts
src/repository/index.ts
src/auth/types.ts
src/auth/supabase.ts
src/auth/index.ts
src/lib/supabase.ts
src/services/supabase.ts (구 단일 파일)
```

---

## ⏭️ 다음 세션 TODO

1. **Vercel 실배포**: 환경변수 설정 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
2. 할부 로직 재검토
3. Phase 2: 카드 결제일 자동 차감, 월별 카드 명세서 뷰
4. 투자 일기 기능 강화 (매매 복기, 감정 태그)
5. PWA 변환 검토
