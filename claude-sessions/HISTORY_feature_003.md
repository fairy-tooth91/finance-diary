# HISTORY_feature_003 - Vercel 마이그레이션 + 인증 시스템 + Repository→Service 패턴 전환

## 📅 세션 정보
- **날짜**: 2026-02-13
- **분류**: feature
- **작업자**: fairy-tooth91
- **이전 세션**: HISTORY_feature_002 (2026-02-10)

## 🎯 세션 목표
1. GitHub Pages → Vercel 배포 마이그레이션
2. Supabase Auth 인증 시스템 도입 (Google, Kakao, Naver)
3. Repository 패턴 → Service 패턴 아키텍처 전환

## ✅ 완료된 작업

### 1. Vercel 마이그레이션
- `vercel.json` 생성 (SPA rewrites)
- `vite.config.ts`에서 `base: '/finance-diary/'` 제거
- `src/App.tsx`에서 `basename="/finance-diary"` 제거
- `src/main.tsx`에서 GitHub Pages SPA 라우팅 핵 제거
- `public/404.html` 삭제
- 환경 변수 전환: 하드코딩 → `import.meta.env.VITE_SUPABASE_*`
- `.env` 파일 생성 + `.gitignore`에 추가

### 2. 인증 시스템 도입
- `src/auth/` 디렉토리 생성 (types.ts, supabase.ts, index.ts)
- `src/context/AuthContext.tsx` 생성
- `src/pages/Login.tsx` 생성 (소셜 로그인 UI)
- OAuth redirect URL을 `window.location.origin + '/'`로 동적 설정
- 첫 로그인 시 users 테이블에 자동 upsert (`ensureUserRecord()`)

### 3. Repository → Service 패턴 전환 (핵심 작업)
- **동기**: Go 백엔드 개발자 관점에서 Repository 인터페이스+팩토리가 과도한 추상화
- **핵심 인사이트**: "자체 백엔드가 필요한 시점이면 Go 서버를 만들고 프론트는 fetch()만 하면 됨"
- **결과**: 인터페이스/팩토리 제거 → 도메인별 함수 직접 export

**생성된 서비스 파일 (12개):**
- `services/client.ts` — Supabase 클라이언트
- `services/auth.ts` — 인증 (소셜 로그인/로그아웃/세션)
- `services/transactions.ts`, `assets.ts`, `loans.ts`, `cards.ts`, `installments.ts` — CRUD
- `services/stockTrades.ts`, `portfolio.ts`, `priceHistory.ts` — 투자 관련
- `services/connection.ts` — DB 연결 테스트
- `services/index.ts` — re-export

**삭제된 파일 (8개):**
- `src/repository/` (types.ts, supabase.ts, index.ts)
- `src/auth/` (types.ts, supabase.ts, index.ts)
- `src/lib/supabase.ts`
- `src/services/supabase.ts` (구 단일 파일)

**수정된 파일:**
- `src/hooks/useFinanceData.ts` — repository → services 함수 호출로 전환
- `src/context/AuthContext.tsx` — auth/ → services import로 전환
- `src/pages/Login.tsx` — import 경로 수정

### 4. 문서 업데이트
- `CLAUDE.md` — Service 패턴 아키텍처, 격리 규칙, 폴더 구조 전면 수정
- `docs/architecture.md` — 시스템 구성도, 레이어 구조, 데이터 흐름 재작성
- `docs/api-spec.md` — Repository Operations → Service Functions
- `docs/adr/004-service-pattern.md` — 새 ADR (ADR-002 대체)

## 📊 작업 통계
| 항목 | 수량 |
|------|------|
| 생성된 파일 | 15+ (서비스 12 + docs 1 + vercel.json + .env) |
| 수정된 파일 | 8+ (hooks, context, pages, docs, CLAUDE.md) |
| 삭제된 파일 | 9 (repository/ 3 + auth/ 3 + lib 1 + services/supabase 1 + 404.html) |
| 빌드 | ✅ 성공 |
| 테스트 | ✅ 34개 통과 |

## 🔧 기술적 결정
1. **Service 패턴 채택**: pennypair 프로젝트와 동일한 구조로 일관성 확보
2. **userId 전달 방식**: 서비스 함수 첫 번째 인자로 명시적 전달 (Repository 팩토리의 클로저 대신)
3. **import 충돌 해결**: `deleteTransaction as deleteTransactionSvc` 별칭으로 서비스/훅 함수명 분리
4. **환경 변수**: Vite의 `import.meta.env` 사용, `.env` 파일로 로컬 관리

## 🔗 관련 문서
- [상세 기록](./details/HISTORY_feature_003_DETAILS.md)
- [ADR-004: Service 패턴](../docs/adr/004-service-pattern.md)
