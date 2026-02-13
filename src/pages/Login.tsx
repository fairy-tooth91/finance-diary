import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { SocialProvider } from '../services';

const SOCIAL_PROVIDERS: { id: SocialProvider; name: string; color: string; bgColor: string }[] = [
  { id: 'google', name: 'Google', color: 'text-gray-700', bgColor: 'bg-white border border-gray-300 hover:bg-gray-50' },
  { id: 'kakao', name: 'Kakao', color: 'text-yellow-900', bgColor: 'bg-yellow-300 hover:bg-yellow-400' },
  { id: 'naver', name: 'Naver', color: 'text-white', bgColor: 'bg-green-500 hover:bg-green-600' },
];

export function Login() {
  const { loginWithSocial } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (provider: SocialProvider) => {
    setIsLoggingIn(true);
    setError(null);
    try {
      await loginWithSocial(provider);
    } catch {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finance Diary</h1>
          <p className="text-gray-500">가계부 & 투자 일기</p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 text-center mb-6">
            로그인
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {SOCIAL_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleLogin(provider.id)}
                disabled={isLoggingIn}
                className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${provider.bgColor} ${provider.color} ${
                  isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span>{provider.name}로 계속하기</span>
              </button>
            ))}
          </div>

          {isLoggingIn && (
            <p className="mt-4 text-center text-sm text-gray-500">
              로그인 페이지로 이동 중...
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          소셜 계정으로 간편하게 시작하세요
        </p>
      </div>
    </div>
  );
}
