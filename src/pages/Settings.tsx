import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

export function Settings() {
  const { isConnected, isLoading, error } = useFinance();
  const [message, setMessage] = useState('');

  const handleClearLocalData = () => {
    if (window.confirm('브라우저 캐시(localStorage)를 삭제하시겠습니까?\nSupabase 데이터는 영향받지 않습니다.')) {
      localStorage.clear();
      setMessage('로컬 캐시가 삭제되었습니다.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">설정</h2>

      {/* Supabase Connection Status */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">데이터 저장소</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <div>
              <p className="font-medium">Supabase (PostgreSQL)</p>
              <p className="text-sm text-gray-500">
                {isLoading
                  ? '연결 확인 중...'
                  : isConnected
                    ? '정상 연결됨 - 모든 기기에서 데이터에 접근할 수 있습니다.'
                    : '연결 실패 - 인터넷 연결을 확인하세요.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Data Management */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">데이터 관리</h3>
        <div className="space-y-4">
          <div>
            <button
              onClick={handleClearLocalData}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              로컬 캐시 삭제
            </button>
            <p className="mt-2 text-sm text-gray-500">
              브라우저에 저장된 캐시 데이터를 삭제합니다. Supabase에 저장된 데이터는 영향받지 않습니다.
            </p>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">앱 정보</h3>
        <p className="text-sm text-gray-600">
          Finance Diary - 개인 재무관리 앱
        </p>
        <p className="text-sm text-gray-500 mt-1">
          가계부와 주식 투자 일기를 결합한 종합 재무관리 웹 앱입니다.
        </p>
      </div>
    </div>
  );
}
