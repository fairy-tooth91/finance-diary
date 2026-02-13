import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  getCurrentUser,
  onAuthStateChange,
  loginWithSocial as loginWithSocialSvc,
  logout as logoutSvc,
} from '../services';
import type { AuthUser, SocialProvider } from '../services';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  loginWithSocial: (provider: SocialProvider) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 초기 세션 확인
    getCurrentUser().then((u) => {
      setUser(u);
      setIsLoading(false);
    });

    // 인증 상태 변경 구독
    const unsubscribe = onAuthStateChange((u) => {
      setUser(u);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithSocial = async (provider: SocialProvider) => {
    await loginWithSocialSvc(provider);
  };

  const logout = async () => {
    await logoutSvc();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithSocial, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
