# ADR-001: Supabase 직접 연결 (BaaS 방식)

## 상태
**채택됨** — 2026-02-02

## 맥락
개인 재무관리 앱의 데이터 저장소가 필요했다. 초기에는 localStorage를 사용했으나, 기기 간 동기화와 데이터 안정성 문제로 서버 저장소가 필요했다.

## 선택지
1. **자체 백엔드** (Express/NestJS + PostgreSQL)
2. **Supabase 직접 연결** (BaaS)
3. **Firebase**

## 결정
Supabase 직접 연결을 선택했다.

## 이유
- 1인 개발 환경에서 백엔드 구축/운영 부담이 크다
- Supabase는 PostgreSQL 기반으로 마이그레이션이 용이하다
- 무료 티어가 초기 개발에 충분하다 (500MB, 50K MAU)
- Row Level Security(RLS)로 보안을 확보할 수 있다
- 향후 자체 백엔드 전환 시 같은 PostgreSQL 스키마를 재사용할 수 있다

## 결과
- 빠른 프로토타이핑이 가능했다
- snake_case(DB) ↔ camelCase(TS) 매핑이 필요해졌다
- 프론트엔드에서 직접 DB를 호출하므로 비즈니스 로직이 클라이언트에 위치한다
- **→ ADR-002에서 Repository 패턴 도입으로 이 결합도를 해소**
