/**
 * 인증 서비스
 *
 * 현재: Supabase Auth
 * 교체: 자체 JWT 인증 시 이 파일만 수정
 */
import { supabase } from './client';
import type { Provider } from '@supabase/supabase-js';

// ============================================
// Types (외부에서 사용)
// ============================================

export type SocialProvider = 'google' | 'kakao' | 'naver';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider?: SocialProvider;
}

// ============================================
// Internal helpers
// ============================================

const PROVIDER_MAP: Record<SocialProvider, Provider> = {
  google: 'google',
  kakao: 'kakao',
  naver: 'naver' as Provider,
};

function toAuthUser(supabaseUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): AuthUser {
  const meta = supabaseUser.user_metadata || {};
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: (meta.full_name as string) || (meta.name as string) || (meta.user_name as string) || supabaseUser.email || '',
    avatarUrl: (meta.avatar_url as string) || (meta.picture as string) || undefined,
    provider: (meta.provider as SocialProvider) || undefined,
  };
}

async function ensureUserRecord(user: AuthUser): Promise<void> {
  const { error } = await supabase
    .from('users')
    .upsert({ id: user.id, email: user.email, name: user.name }, { onConflict: 'id' });
  if (error) {
    console.error('Failed to upsert user record:', error);
  }
}

// ============================================
// Exported functions
// ============================================

export async function loginWithSocial(provider: SocialProvider): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: PROVIDER_MAP[provider],
    options: {
      redirectTo: window.location.origin + '/',
    },
  });
  if (error) throw error;
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return toAuthUser(user);
}

export function onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (session?.user) {
        const authUser = toAuthUser(session.user);
        await ensureUserRecord(authUser);
        callback(authUser);
      } else {
        callback(null);
      }
    }
  );
  return () => subscription.unsubscribe();
}
