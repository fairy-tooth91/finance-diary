# ADR-003: Supabase Auth 우선, 자체 인증 대비

## 상태
**채택됨** — 2026-02-12

## 맥락
서비스를 소규모로라도 운영하려면 다중 사용자 인증이 필요하다. 이메일 인증은 메일 서버가 필요하므로 소셜 로그인(Google, Kakao, Naver)으로 시작한다.

## 선택지
1. **Supabase Auth** — 지금 바로 사용 가능
2. **자체 JWT + OAuth** — 서버 구축 필요
3. **Firebase Auth** — 다른 BaaS 의존

## 결정
Supabase Auth로 시작하되, 자체 인증 전환이 가능하도록 추상화했다.

## 구조
```
AuthProvider (인터페이스)
  ├── loginWithSocial(provider)
  ├── logout()
  ├── getCurrentUser()
  └── onAuthStateChange(callback)

구현체:
  ├── SupabaseAuthProvider (현재)
  └── CustomAuthProvider (미래 - JWT + OAuth)
```

## 인증 흐름
1. 사용자가 소셜 로그인 버튼 클릭
2. Supabase Auth → 해당 OAuth 제공자 리다이렉트
3. 인증 성공 → Supabase가 JWT 발급
4. `onAuthStateChange`로 사용자 정보 수신
5. `users` 테이블에 자동 upsert (최초 로그인 시)
6. `Repository`에 인증된 user_id 전달

## 소셜 로그인 제공자
| 제공자 | 대상 | 우선순위 |
|--------|------|----------|
| Google | 전체 사용자 | P0 |
| Kakao | 한국 사용자 | P0 |
| Naver | 한국 사용자 | P0 |
| Apple | iOS 사용자 | P1 (향후) |

## Supabase 대시보드 설정 필요
각 소셜 제공자에서 OAuth 앱을 생성하고, Client ID/Secret을 Supabase Dashboard → Authentication → Providers에 등록해야 한다.

## 결과
- Repository 패턴(ADR-002)과 동일한 방식으로 Auth도 인터페이스 추상화
- 수익이 서버 비용을 감당할 때 자체 인증으로 전환 가능
- 전환 시 `auth/custom.ts` 파일 1개 추가 + 팩토리 1줄 수정
