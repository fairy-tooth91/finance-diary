# ADR-002: Repository 패턴 도입

## 상태
**채택됨** — 2026-02-12

## 맥락
ADR-001에서 Supabase를 직접 연결했으나, 서비스 성장 시 자체 백엔드로 전환해야 할 수 있다. 기존 구조에서는 `supabase.ts`의 모든 CRUD 함수와 `useFinanceData.ts`의 데이터 호출부를 동시에 수정해야 했다.

## 문제
```
기존: useFinanceData → supabaseService.getXxx() (직접 호출)
                        ↑ Supabase SDK에 강하게 결합
```
- 백엔드 전환 시 훅 코드도 함께 수정 필요
- 테스트 시 Supabase 모킹이 어렵다
- snake_case ↔ camelCase 매핑이 비즈니스 로직과 혼재

## 결정
Repository 패턴을 도입하여 데이터 접근을 인터페이스로 추상화했다.

## 구조
```
src/repository/
├── types.ts      # DataRepository 인터페이스 (계약)
├── supabase.ts   # Supabase 구현체
└── index.ts      # 팩토리 함수 (getRepository)
```

### 인터페이스 설계 원칙
- 엔티티별 독립 Repository (`TransactionRepository`, `AssetRepository` 등)
- 통합 `DataRepository` 인터페이스로 묶음
- 각 Repository는 `getAll`, `add`, `update`, `delete` 표준 메서드
- snake_case ↔ camelCase 매핑은 구현체 내부에 캡슐화

### 팩토리 패턴
```typescript
// 현재: Supabase 직접 호출
getRepository() → createSupabaseRepository(url, key, userId)

// 미래: 자체 백엔드 API 호출
getRepository() → createFetchRepository(apiBaseUrl)
```

## 결과
- **훅/컴포넌트 변경 없이** 백엔드 교체 가능
- `setRepository()`로 테스트 시 Mock Repository 주입 가능
- 매핑 로직이 구현체에 캡슐화되어 비즈니스 로직이 깨끗해짐
- **변경 범위**: 백엔드 전환 시 파일 1개 추가 + 팩토리 1줄 수정
