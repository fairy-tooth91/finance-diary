import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Modal } from '../components/common/Modal';
import { formatKRW, formatDate, formatDateInput } from '../utils/format';

export function Stocks() {
  const { stockTrades, addStockTrade, deleteStockTrade, isLoading } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');

  // Form state
  const [formData, setFormData] = useState({
    date: formatDateInput(),
    stockName: '',
    stockCode: '',
    tradeType: 'buy' as 'buy' | 'sell',
    quantity: '',
    price: '',
    memo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addStockTrade({
      date: formData.date,
      stockName: formData.stockName,
      stockCode: formData.stockCode,
      tradeType: formData.tradeType,
      quantity: parseInt(formData.quantity) || 0,
      price: parseFloat(formData.price) || 0,
      memo: formData.memo,
    });

    if (success) {
      setIsModalOpen(false);
      setFormData({
        date: formatDateInput(),
        stockName: '',
        stockCode: '',
        tradeType: 'buy',
        quantity: '',
        price: '',
        memo: '',
      });
    }
  };

  // Filter trades
  const filteredTrades = stockTrades
    .filter((t) => filterType === 'all' || t.tradeType === filterType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate totals
  const totalBuy = stockTrades
    .filter((t) => t.tradeType === 'buy')
    .reduce((sum, t) => sum + t.total, 0);
  const totalSell = stockTrades
    .filter((t) => t.tradeType === 'sell')
    .reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">주식 매매 기록</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          + 매매 추가
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">매매 유형</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'buy' | 'sell')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="buy">매수</option>
              <option value="sell">매도</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <h3 className="text-sm font-medium text-red-800">총 매수 금액</h3>
          <p className="text-xl font-bold text-red-600">{formatKRW(totalBuy)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h3 className="text-sm font-medium text-green-800">총 매도 금액</h3>
          <p className="text-xl font-bold text-green-600">{formatKRW(totalSell)}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800">총 거래 건수</h3>
          <p className="text-xl font-bold text-blue-600">{stockTrades.length}건</p>
        </div>
      </div>

      {/* Trade List */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {filteredTrades.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredTrades.map((trade) => (
              <div key={trade.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        trade.tradeType === 'buy'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {trade.tradeType === 'buy' ? '매수' : '매도'}
                    </div>
                    <div>
                      <p className="font-medium">{trade.stockName}</p>
                      <p className="text-sm text-gray-500">{trade.stockCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatDate(trade.date)}</p>
                    <button
                      onClick={() => deleteStockTrade(trade.id)}
                      className="text-gray-400 hover:text-red-500 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">수량:</span>{' '}
                    <span className="font-medium">{trade.quantity}주</span>
                  </div>
                  <div>
                    <span className="text-gray-500">단가:</span>{' '}
                    <span className="font-medium">{formatKRW(trade.price)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">총액:</span>{' '}
                    <span className={`font-bold ${trade.tradeType === 'buy' ? 'text-red-600' : 'text-green-600'}`}>
                      {formatKRW(trade.total)}
                    </span>
                  </div>
                </div>
                {trade.memo && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{trade.memo}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            매매 기록이 없습니다.
          </div>
        )}
      </div>

      {/* Add Trade Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="매매 기록 추가"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">매매 유형</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="buy"
                  checked={formData.tradeType === 'buy'}
                  onChange={(e) =>
                    setFormData({ ...formData, tradeType: e.target.value as 'buy' | 'sell' })
                  }
                  className="mr-2"
                />
                매수
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="sell"
                  checked={formData.tradeType === 'sell'}
                  onChange={(e) =>
                    setFormData({ ...formData, tradeType: e.target.value as 'buy' | 'sell' })
                  }
                  className="mr-2"
                />
                매도
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종목명</label>
            <input
              type="text"
              value={formData.stockName}
              onChange={(e) => setFormData({ ...formData, stockName: e.target.value })}
              placeholder="예: 삼성전자"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종목코드</label>
            <input
              type="text"
              value={formData.stockCode}
              onChange={(e) => setFormData({ ...formData, stockCode: e.target.value })}
              placeholder="예: 005930.KS (코스피) 또는 035720.KQ (코스닥)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              한국 주식: 코스피는 .KS, 코스닥은 .KQ를 붙여주세요
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">수량 (주)</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">단가 (원)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
              />
            </div>
          </div>

          {formData.quantity && formData.price && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                총 금액:{' '}
                <span className="font-bold">
                  {formatKRW(parseInt(formData.quantity) * parseFloat(formData.price))}
                </span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              메모 (투자 일기)
            </label>
            <textarea
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              placeholder="매매 판단 근거, 시장 상황, 느낀 점 등을 기록하세요"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
