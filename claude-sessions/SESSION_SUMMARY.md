# Finance Diary - 세션 요약

## 🎯 **현재 상태**

### 프로젝트 정보
- **이름**: Finance Diary (개인 재무관리 앱)
- **위치**: `/root/Workspace/playground/finance-diary`
- **GitHub**: https://github.com/fairy-tooth91/finance-diary
- **배포 URL**: https://fairy-tooth91.github.io/finance-diary/
- **브랜치**: `develop` (작업), `master` (안정), `gh-pages` (배포)
- **Supabase**: `afypqjipbjjdmzevsxow.supabase.co` (public 스키마)

### 기술 스택
- React 19 + TypeScript + Vite
- Tailwind CSS
- Recharts (차트)
- Yahoo Finance API (주가 + 시장 지표)
- Supabase (PostgreSQL 클라우드 DB)
- GitHub Pages (배포)

### 구현 완료 기능
| 페이지 | 기능 | 상태 |
|--------|------|------|
| 대시보드 | 수입/지출 요약, 차트, 고점 하락 알림, **시장 지표 5종** | ✅ |
| 가계부 | 수입/지출 CRUD, **결제수단(현금/카드) 분기**, **월별 할부 현황** | ✅ |
| 자산 | 자산/대출/**카드**/할부 관리, 순자산 계산 (**할부 부채 반영**) | ✅ |
| 주식매매 | 매수/매도 기록, 투자 일기 | ✅ |
| 포트폴리오 | 보유종목, 수익률, 고점 추적, -10% 알림 | ✅ |
| 설정 | **Supabase 연결 상태 표시** | ✅ |

### 대시보드 시장 지표
| 지표 | Yahoo Finance 심볼 | 표시 |
|------|-------------------|------|
| 코스피 | ^KS11 | 지수 + 등락률 |
| 나스닥 | ^IXIC | 지수 + 등락률 |
| USD/KRW | USDKRW=X | 1달러당 원화 |
| JPY100/KRW | JPYKRW=X (×100) | 100엔당 원화 |
| 금(KRX) | GC=F × USDKRW ÷ 31.1035 | KRW/g |

### DB 스키마
- 9개 테이블 (`db/init/` SQL 파일로 관리)
- 모든 테이블에 `user_id UUID FK → users(id)`
- 기본 사용자: `00000000-0000-0000-0000-000000000001`

### 테스트
- 34개 테스트 통과 (format, yahooFinance, types)

## 📋 **진행 중 / 미해결**

### 할부 로직 재검토 필요
- 이전 세션에서 사용자 피드백 있었음

### Supabase 테이블 생성
- 사용자가 SQL Editor에서 `db/init/` 파일 순서대로 실행 필요

### 향후 고려사항 (Phase 2)
- 카드 결제일 도래 시 연결계좌 자동 차감
- 월별 카드 명세서 뷰
- PWA 변환

## 📁 **문서 위치**
- `CLAUDE.md` - 현재 구현 현황 (프로젝트 루트)
- `doc/v0.1.md` - 최초 요구사항
- `db/init/` - DB 스키마 SQL 파일 (실행 순서: 1→2→3)

## 🔗 **세션 기록**
- [HISTORY_feature_001.md](./HISTORY_feature_001.md) - 초기 구현 (2026-02-02)
- [HISTORY_feature_002.md](./HISTORY_feature_002.md) - Supabase + 카드/할부 + 시장 지표 (2026-02-10)
- [details/](./details/) - 상세 기록
