# HISTORY_feature_002 - Supabase 마이그레이션 + 카드/할부 리팩토링 + 대시보드 시장 지표

## 📅 세션 정보
- **날짜**: 2026-02-10
- **분류**: feature
- **작업자**: fairy-tooth91
- **이전 세션**: 2026-02-02 ~ 2026-02-09 (컨텍스트 연속)

## 🎯 세션 목표
1. Supabase 클라우드 DB 마이그레이션 (localStorage → PostgreSQL)
2. 결제수단/카드/할부 통합 리팩토링
3. 대시보드 시장 지표 추가

## ✅ 완료된 작업

### 1. Supabase 마이그레이션
- `@supabase/supabase-js` 설치
- `src/services/supabase.ts` 서비스 레이어 (snake_case ↔ camelCase 매핑)
- DB 스키마 SQL 9개 파일 생성 (`db/init/`)
  - 1: users (UUID PK, 기본 사용자 INSERT)
  - 2: assets, cards, loans, stock_trades, portfolio, price_history
  - 3: transactions (FK→cards), installments (FK→cards)
- 모든 테이블에 `user_id UUID FK → users(id)` 추가
- Settings 페이지: Google Sheets → Supabase 연결 상태로 변경
- `googleSheets.ts` 삭제

### 2. 카드/할부/결제수단 리팩토링
- Card 인터페이스 추가 (체크/신용, 결제일, 연결계좌)
- Transaction에 paymentMethod, cardId 추가
- 자산 페이지: 카드 탭 추가 (등록/수정/삭제)
- 거래 추가 폼: 현금/카드 → 할부 분기 UI
- 월별 할부 결제 현황 섹션
- 순자산에 할부 잔여금 부채 반영

### 3. 대시보드 시장 지표
- 코스피(^KS11), 나스닥(^IXIC), USD/KRW, JPY100/KRW, 금(GC=F→KRW/g)
- 전일 종가 대비 등락률/등락폭 (한국식: 상승 빨강, 하락 파랑)
- 금 시세: COMEX 선물 × USD/KRW ÷ 31.1035 (트로이온스→g)

## 🐛 버그 수정
- **chartPreviousClose NaN 이슈**: Yahoo Finance chart API의 전일종가 필드명이 `previousClose`가 아니라 `chartPreviousClose`였음. curl로 실제 API 응답 확인하여 진단 및 수정.

## 📊 작업 통계
| 항목 | 수량 |
|------|------|
| 수정된 파일 | 10+ |
| 생성된 파일 | 10 (SQL 9 + supabase.ts) |
| 삭제된 파일 | 1 (googleSheets.ts) |
| 커밋 | 3 |
| 배포 | 1회 |

## 🔧 기술적 결정
1. **Supabase public 스키마**: 사용자 테이블 기본 위치
2. **기본 사용자 ID**: `00000000-0000-0000-0000-000000000001` (인증 전)
3. **CORS 프록시 유지**: allorigins.win (클라이언트 사이드 API 호출)
4. **금 시세 환산**: KRX 직접 API 없어서 COMEX×환율로 참고 시세 제공
5. **JPY 환율**: API 1엔 단가 × 100 = 100엔당 원화 (한국 관례)

## ⚠️ 미해결 이슈
- 사용자가 Supabase SQL Editor에서 직접 테이블 생성 필요 (`db/init/` 순서대로)
- 할부 로직 재검토 (이전 세션에서 사용자 피드백)

## 🔗 관련 문서
- [상세 기록](./details/HISTORY_feature_002_DETAILS.md)
- [리팩토링 계획](../.claude/plans/polished-fluttering-pike.md)
