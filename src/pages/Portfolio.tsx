import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  formatKRW,
  formatPercent,
  getValueColor,
  getAlertBgColor,
} from '../utils/format';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export function Portfolio() {
  const {
    portfolio,
    priceHistory,
    refreshPrices,
    getDropAlerts,
    getSummary,
    isLoading,
  } = useFinance();
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  const summary = getSummary();
  const alerts = getDropAlerts();

  // Get price history for selected stock
  const selectedHistory = selectedStock
    ? priceHistory
        .filter((p) => p.stockCode === selectedStock)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30)
        .map((p) => ({
          date: p.date.slice(5),
          price: p.closePrice,
        }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">포트폴리오</h2>
        <button
          onClick={() => refreshPrices()}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '시세 갱신 중...' : '시세 갱신'}
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">총 평가금액</h3>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {formatKRW(summary.totalAssets)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">총 투자원금</h3>
          <p className="mt-1 text-2xl font-bold text-gray-700">
            {formatKRW(summary.totalCost)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">총 평가손익</h3>
          <p className={`mt-1 text-2xl font-bold ${getValueColor(summary.totalProfitLoss)}`}>
            {formatKRW(summary.totalProfitLoss)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">총 수익률</h3>
          <p className={`mt-1 text-2xl font-bold ${getValueColor(summary.totalProfitRate)}`}>
            {formatPercent(summary.totalProfitRate)}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            ⚠️ 고점 대비 -10% 이상 하락 종목
          </h3>
          <p className="text-sm text-red-600 mb-3">
            다음 종목들이 보유 기간 중 최고가 대비 10% 이상 하락했습니다.
          </p>
          <div className="flex flex-wrap gap-2">
            {alerts.map((h) => (
              <span
                key={h.stockCode}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
              >
                {h.stockName} ({formatPercent(h.dropFromHigh)})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">보유 종목</h3>
        </div>
        {portfolio.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">종목</th>
                  <th className="px-4 py-3 text-right">보유수량</th>
                  <th className="px-4 py-3 text-right">평균단가</th>
                  <th className="px-4 py-3 text-right">현재가</th>
                  <th className="px-4 py-3 text-right">평가금액</th>
                  <th className="px-4 py-3 text-right">수익률</th>
                  <th className="px-4 py-3 text-right">고점</th>
                  <th className="px-4 py-3 text-right">고점대비</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {portfolio.map((holding) => (
                  <tr
                    key={holding.stockCode}
                    className={`cursor-pointer transition-colors ${getAlertBgColor(holding.dropFromHigh)} hover:bg-gray-50`}
                    onClick={() =>
                      setSelectedStock(
                        selectedStock === holding.stockCode
                          ? null
                          : holding.stockCode
                      )
                    }
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{holding.stockName}</div>
                      <div className="text-gray-500 text-xs">{holding.stockCode}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{holding.quantity}주</td>
                    <td className="px-4 py-3 text-right">{formatKRW(holding.avgPrice)}</td>
                    <td className="px-4 py-3 text-right">{formatKRW(holding.currentPrice)}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatKRW(holding.currentPrice * holding.quantity)}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${getValueColor(holding.profitRate)}`}>
                      {formatPercent(holding.profitRate)}
                    </td>
                    <td className="px-4 py-3 text-right">{formatKRW(holding.highPrice)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${getValueColor(holding.dropFromHigh)}`}>
                      {formatPercent(holding.dropFromHigh)}
                      {holding.dropFromHigh <= -10 && (
                        <span className="ml-1">⚠️</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            보유 종목이 없습니다. 주식매매 페이지에서 매수 기록을 추가하세요.
          </div>
        )}
      </div>

      {/* Price Chart for Selected Stock */}
      {selectedStock && selectedHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {portfolio.find((h) => h.stockCode === selectedStock)?.stockName} 가격 추이
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={selectedHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip formatter={(value) => formatKRW(value as number)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="price"
                name="종가"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">사용 안내</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• "시세 갱신" 버튼을 클릭하면 Yahoo Finance에서 현재가를 가져옵니다.</li>
          <li>• 고점은 보유 기간 중 3개월 내 최고가로 계산됩니다.</li>
          <li>• 고점 대비 -10% 이상 하락하면 빨간색 배경과 경고 아이콘이 표시됩니다.</li>
          <li>• 종목을 클릭하면 가격 추이 차트를 볼 수 있습니다.</li>
          <li>• 한국 주식 코드: 코스피(.KS), 코스닥(.KQ) - 예: 삼성전자 005930.KS</li>
        </ul>
      </div>
    </div>
  );
}
