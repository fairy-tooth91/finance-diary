import { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';

export function Settings() {
  const {
    sheetsConfig,
    setSheetsConfig,
    useSheetsApi,
    setUseSheetsApi,
    isAuthorized,
    initializeSheets,
    authorizeSheets,
    syncWithSheets,
    isLoading,
    error,
  } = useFinance();

  const [localConfig, setLocalConfig] = useState(sheetsConfig);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setLocalConfig(sheetsConfig);
  }, [sheetsConfig]);

  const handleSaveConfig = () => {
    setSheetsConfig(localConfig);
    setSaveMessage('설정이 저장되었습니다.');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleInitialize = async () => {
    setSheetsConfig(localConfig);
    const success = await initializeSheets();
    if (success) {
      setSaveMessage('Google Sheets API가 초기화되었습니다.');
    } else {
      setSaveMessage('초기화에 실패했습니다. 설정을 확인하세요.');
    }
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleAuthorize = async () => {
    const success = await authorizeSheets();
    if (success) {
      setSaveMessage('인증에 성공했습니다.');
    } else {
      setSaveMessage('인증에 실패했습니다.');
    }
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleSync = async () => {
    const success = await syncWithSheets();
    if (success) {
      setSaveMessage('동기화가 완료되었습니다.');
    } else {
      setSaveMessage('동기화에 실패했습니다.');
    }
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleClearLocalData = () => {
    if (window.confirm('로컬 데이터를 모두 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      localStorage.removeItem('transactions');
      localStorage.removeItem('stockTrades');
      localStorage.removeItem('portfolio');
      localStorage.removeItem('priceHistory');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">설정</h2>

      {/* Storage Mode */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">데이터 저장 방식</h3>
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              checked={!useSheetsApi}
              onChange={() => setUseSheetsApi(false)}
              className="mt-1"
            />
            <div>
              <p className="font-medium">로컬 저장소 (기본값)</p>
              <p className="text-sm text-gray-500">
                브라우저의 localStorage에 데이터를 저장합니다.
                설정 없이 바로 사용할 수 있지만, 다른 기기에서는 데이터에 접근할 수 없습니다.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              checked={useSheetsApi}
              onChange={() => setUseSheetsApi(true)}
              className="mt-1"
            />
            <div>
              <p className="font-medium">Google Sheets</p>
              <p className="text-sm text-gray-500">
                Google Sheets에 데이터를 저장합니다.
                여러 기기에서 동일한 데이터에 접근할 수 있습니다.
                Google Cloud Console에서 API 키와 OAuth 클라이언트 ID가 필요합니다.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Google Sheets Configuration */}
      {useSheetsApi && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Google Sheets 설정</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spreadsheet ID
              </label>
              <input
                type="text"
                value={localConfig.spreadsheetId}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, spreadsheetId: e.target.value })
                }
                placeholder="스프레드시트 URL에서 /d/ 뒤의 ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                예: https://docs.google.com/spreadsheets/d/<strong>이 부분</strong>/edit
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={localConfig.apiKey}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, apiKey: e.target.value })
                }
                placeholder="Google Cloud Console에서 발급받은 API Key"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OAuth Client ID
              </label>
              <input
                type="password"
                value={localConfig.clientId}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, clientId: e.target.value })
                }
                placeholder="Google Cloud Console에서 발급받은 Client ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                설정 저장
              </button>
              <button
                onClick={handleInitialize}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                초기화
              </button>
              <button
                onClick={handleAuthorize}
                disabled={isLoading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {isAuthorized ? '재인증' : '인증하기'}
              </button>
              {isAuthorized && (
                <button
                  onClick={handleSync}
                  disabled={isLoading}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                >
                  동기화
                </button>
              )}
            </div>

            {isAuthorized && (
              <p className="text-sm text-green-600">✓ Google Sheets에 연결됨</p>
            )}
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      {useSheetsApi && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">설정 방법</h3>
          <ol className="text-sm text-yellow-700 space-y-2 list-decimal list-inside">
            <li>
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Google Cloud Console
              </a>
              에서 새 프로젝트를 생성합니다.
            </li>
            <li>Google Sheets API를 활성화합니다.</li>
            <li>API Key를 생성합니다 (API 및 서비스 → 사용자 인증 정보).</li>
            <li>OAuth 2.0 클라이언트 ID를 생성합니다 (웹 애플리케이션 유형).</li>
            <li>승인된 JavaScript 원본에 현재 도메인을 추가합니다.</li>
            <li>
              Google Sheets에서 새 스프레드시트를 생성하고 시트 이름을 설정합니다:
              <ul className="ml-4 mt-1 list-disc">
                <li>Transactions</li>
                <li>StockTrades</li>
                <li>Portfolio</li>
                <li>PriceHistory</li>
              </ul>
            </li>
          </ol>
        </div>
      )}

      {/* Messages */}
      {saveMessage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700">
          {saveMessage}
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
              로컬 데이터 삭제
            </button>
            <p className="mt-2 text-sm text-gray-500">
              브라우저에 저장된 모든 데이터를 삭제합니다. Google Sheets 데이터는 영향받지 않습니다.
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
