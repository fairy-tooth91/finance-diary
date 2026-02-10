import { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatKRW, formatPercent, getValueColor } from '../utils/format';
import { yahooFinanceService, type MarketIndicator } from '../services/yahooFinance';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function formatIndicatorPrice(indicator: MarketIndicator): string {
  if (indicator.symbol === 'GOLD_KRW') {
    // 금: 정수 + 원/g
    return `${indicator.price.toLocaleString('ko-KR')}${indicator.unit}`;
  }
  if (indicator.symbol.includes('KRW')) {
    // 환율: 소수점 2자리 + 원
    return `${indicator.price.toFixed(2)}${indicator.unit}`;
  }
  // 지수: 소수점 2자리
  return indicator.price.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function Dashboard() {
  const { getSummary, transactions, portfolio, getDropAlerts, refreshPrices, isLoading } = useFinance();
  const summary = getSummary();
  const alerts = getDropAlerts();

  // 시장 지표
  const [marketData, setMarketData] = useState<MarketIndicator[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchMarket = async () => {
      setMarketLoading(true);
      try {
        const data = await yahooFinanceService.getMarketIndicators();
        if (!cancelled) setMarketData(data);
      } catch {
        // 실패 시 빈 상태 유지
      } finally {
        if (!cancelled) setMarketLoading(false);
      }
    };
    fetchMarket();
    return () => { cancelled = true; };
  }, []);

  // Prepare expense by category data for pie chart
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = transactions.filter((t) => {
    const date = new Date(t.date);
    return (
      t.type === 'expense' &&
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });

  const expenseByCategory = monthlyExpenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  // Portfolio performance data for line chart (last 10 transactions)
  const recentTransactions = transactions.slice(-30).map((t, index) => ({
    name: t.date.slice(5),
    amount: t.type === 'income' ? t.amount : -t.amount,
    index,
  }));

  return (
    <div className="space-y-6">
      {/* Market Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {marketLoading ? (
          <div className="col-span-full text-center text-sm text-gray-400 py-3">시장 지표 로딩 중...</div>
        ) : marketData.length > 0 ? (
          marketData.map((ind) => (
            <div key={ind.symbol} className="bg-white rounded-lg shadow px-4 py-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">{ind.label}</span>
                <span className={`text-xs font-medium ${ind.change >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                  {ind.change >= 0 ? '+' : ''}{ind.changePercent.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-end justify-between mt-1">
                <span className="text-lg font-bold">{formatIndicatorPrice(ind)}</span>
                <span className={`text-xs ${ind.change >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                  {ind.change >= 0 ? '+' : ''}{ind.symbol === 'GOLD_KRW' ? ind.change.toLocaleString('ko-KR') : ind.change.toFixed(2)}
                </span>
              </div>
            </div>
          ))
        ) : null}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">이번 달 수입</h3>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {formatKRW(summary.monthlyIncome)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">이번 달 지출</h3>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatKRW(summary.monthlyExpense)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">이번 달 순수익</h3>
          <p className={`mt-2 text-2xl font-bold ${getValueColor(summary.monthlyNet)}`}>
            {formatKRW(summary.monthlyNet)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">총 투자자산</h3>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {formatKRW(summary.totalAssets)}
          </p>
          <p className={`text-sm ${getValueColor(summary.totalProfitRate)}`}>
            {formatPercent(summary.totalProfitRate)}
          </p>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-3">
            고점 대비 -10% 이상 하락 종목
          </h3>
          <div className="space-y-2">
            {alerts.map((holding) => (
              <div
                key={holding.stockCode}
                className="flex items-center justify-between bg-white rounded p-3 border border-red-200"
              >
                <div>
                  <span className="font-medium">{holding.stockName}</span>
                  <span className="text-gray-500 ml-2">({holding.stockCode})</span>
                </div>
                <div className="text-right">
                  <p className="text-red-600 font-bold">
                    {formatPercent(holding.dropFromHigh)}
                  </p>
                  <p className="text-sm text-gray-500">
                    고점: {formatKRW(holding.highPrice)} → 현재: {formatKRW(holding.currentPrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Chart */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">최근 수입/지출 추이</h3>
          {recentTransactions.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={recentTransactions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatKRW(value as number)} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              거래 내역이 없습니다
            </div>
          )}
        </div>

        {/* Expense by Category Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">이번 달 카테고리별 지출</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatKRW(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              지출 내역이 없습니다
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">포트폴리오 현황</h3>
          <button
            onClick={() => refreshPrices()}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? '갱신 중...' : '시세 갱신'}
          </button>
        </div>
        {portfolio.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">종목</th>
                  <th className="px-4 py-2 text-right">보유수량</th>
                  <th className="px-4 py-2 text-right">평균단가</th>
                  <th className="px-4 py-2 text-right">현재가</th>
                  <th className="px-4 py-2 text-right">수익률</th>
                  <th className="px-4 py-2 text-right">고점대비</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {portfolio.map((holding) => (
                  <tr key={holding.stockCode}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{holding.stockName}</div>
                      <div className="text-gray-500 text-xs">{holding.stockCode}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{holding.quantity}주</td>
                    <td className="px-4 py-3 text-right">{formatKRW(holding.avgPrice)}</td>
                    <td className="px-4 py-3 text-right">{formatKRW(holding.currentPrice)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${getValueColor(holding.profitRate)}`}>
                      {formatPercent(holding.profitRate)}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${getValueColor(holding.dropFromHigh)}`}>
                      {formatPercent(holding.dropFromHigh)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            보유 종목이 없습니다. 주식매매 페이지에서 매수 기록을 추가하세요.
          </div>
        )}
      </div>
    </div>
  );
}
