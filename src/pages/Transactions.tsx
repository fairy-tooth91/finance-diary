import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Modal } from '../components/common/Modal';
import { formatKRW, formatDate, formatDateInput } from '../utils/format';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';

export function Transactions() {
  const {
    transactions,
    addTransaction,
    addInstallment,
    deleteTransaction,
    cards,
    getInstallmentsForMonth,
    isLoading,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [installmentCardFilter, setInstallmentCardFilter] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    date: formatDateInput(),
    type: 'expense' as 'income' | 'expense',
    category: '식비',
    amount: '',
    memo: '',
    paymentMethod: 'card' as 'cash' | 'card',
    cardId: '',
    isInstallment: false,
    installmentMonths: '3',
  });

  const selectedCard = cards.find((c) => c.id === formData.cardId);
  const isCredit = selectedCard?.type === 'credit';
  const amount = parseFloat(formData.amount) || 0;
  const installmentMonths = parseInt(formData.installmentMonths) || 1;
  const monthlyAmount = formData.isInstallment && installmentMonths > 0
    ? Math.round(amount / installmentMonths)
    : 0;

  const resetForm = () => {
    setFormData({
      date: formatDateInput(),
      type: 'expense',
      category: '식비',
      amount: '',
      memo: '',
      paymentMethod: 'card',
      cardId: '',
      isInstallment: false,
      installmentMonths: '3',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.type === 'expense' && formData.paymentMethod === 'card' && isCredit && formData.isInstallment) {
      // 신용카드 할부 → Installment 생성 (내부에서 Transaction도 생성)
      const success = await addInstallment({
        itemName: formData.memo || formData.category,
        cardId: selectedCard!.id,
        cardName: selectedCard!.name,
        category: formData.category,
        totalAmount: amount,
        monthlyAmount: Math.round(amount / installmentMonths),
        totalMonths: installmentMonths,
        startDate: formData.date,
        paymentDay: selectedCard!.billingDay || parseInt(formData.date.split('-')[2]),
        memo: formData.memo,
      });
      if (success) {
        setIsModalOpen(false);
        resetForm();
      }
    } else {
      // 현금 / 체크카드 / 신용카드 일시불 / 수입
      const txData: Parameters<typeof addTransaction>[0] = {
        date: formData.date,
        type: formData.type,
        category: formData.category,
        amount,
        memo: formData.memo,
      };
      if (formData.type === 'expense') {
        txData.paymentMethod = formData.paymentMethod;
        if (formData.paymentMethod === 'card' && formData.cardId) {
          txData.cardId = formData.cardId;
        }
      }
      const success = await addTransaction(txData);
      if (success) {
        setIsModalOpen(false);
        resetForm();
      }
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesMonth = t.date.startsWith(filterMonth);
    return matchesType && matchesMonth;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Installments for selected month
  const monthInstallments = getInstallmentsForMonth(filterMonth);
  const filteredInstallments = installmentCardFilter === 'all'
    ? monthInstallments
    : monthInstallments.filter((i) => i.cardId === installmentCardFilter);
  const installmentTotal = filteredInstallments.reduce((sum, i) => sum + i.monthlyAmount, 0);
  const installmentRemainingTotal = filteredInstallments.reduce((sum, i) => sum + i.remainingAmount, 0);

  // Cards used in active installments (for filter)
  const installmentCards = [...new Set(monthInstallments.map((i) => i.cardId))];

  // Helper to get card name by id
  const getCardName = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    return card?.name || cardId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">가계부</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          + 거래 추가
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">월</label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="income">수입</option>
              <option value="expense">지출</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h3 className="text-sm font-medium text-green-800">수입</h3>
          <p className="text-xl font-bold text-green-600">{formatKRW(totalIncome)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <h3 className="text-sm font-medium text-red-800">지출</h3>
          <p className="text-xl font-bold text-red-600">{formatKRW(totalExpense)}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800">순수익</h3>
          <p className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatKRW(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {filteredTransactions.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {transaction.type === 'income' ? '↓' : '↑'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{transaction.category}</p>
                      {transaction.paymentMethod === 'card' && transaction.cardId && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                          {getCardName(transaction.cardId)}
                        </span>
                      )}
                      {transaction.paymentMethod === 'cash' && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                          현금
                        </span>
                      )}
                      {transaction.installmentId && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded">
                          할부
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                    {transaction.memo && (
                      <p className="text-sm text-gray-400">{transaction.memo}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p
                    className={`font-bold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatKRW(transaction.amount)}
                  </p>
                  <button
                    onClick={() => deleteTransaction(transaction.id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                    title="삭제"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            해당 기간에 거래 내역이 없습니다.
          </div>
        )}
      </div>

      {/* Monthly Installment Status */}
      {monthInstallments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">할부 결제 현황</h3>
            {installmentCards.length > 1 && (
              <select
                value={installmentCardFilter}
                onChange={(e) => setInstallmentCardFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체 카드</option>
                {installmentCards.map((cardId) => (
                  <option key={cardId} value={cardId}>{getCardName(cardId)}</option>
                ))}
              </select>
            )}
          </div>

          {/* Installment Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h4 className="text-sm font-medium text-orange-800">이번 달 할부금</h4>
              <p className="text-xl font-bold text-orange-600">{formatKRW(installmentTotal)}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h4 className="text-sm font-medium text-orange-800">전체 잔여</h4>
              <p className="text-xl font-bold text-orange-600">{formatKRW(installmentRemainingTotal)}</p>
            </div>
          </div>

          {/* Installment List */}
          <div className="bg-white rounded-lg shadow border border-gray-200 divide-y divide-gray-200">
            {filteredInstallments.map((inst) => (
              <div key={inst.id} className="p-4">
                {inst.isLastPayment && (
                  <div className="mb-2 px-2 py-1 bg-green-50 border border-green-200 rounded text-sm text-green-700 font-medium">
                    마지막 결제!
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{inst.startDate.slice(5)}</span>
                      <span className="font-medium">{inst.itemName}</span>
                      <span className="text-sm text-gray-500">총 {formatKRW(inst.totalAmount)}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {inst.cardName} · {inst.totalMonths}개월 중 {inst.paymentNumber}회차
                      {!inst.isLastPayment && ` · 잔여 ${formatKRW(inst.remainingAmount)}`}
                    </p>
                  </div>
                  <p className="font-bold text-orange-600">
                    {formatKRW(inst.monthlyAmount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="거래 추가"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as 'income' | 'expense',
                      category: '식비',
                    })
                  }
                  className="mr-2"
                />
                지출
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as 'income' | 'expense',
                      category: '급여',
                    })
                  }
                  className="mr-2"
                />
                수입
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">금액 (원)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
            />
          </div>

          {/* 결제수단 (지출일 때만) */}
          {formData.type === 'expense' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">결제수단</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'card' })}
                      className="mr-2"
                    />
                    카드
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="cash"
                      checked={formData.paymentMethod === 'cash'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'cash', cardId: '', isInstallment: false })}
                      className="mr-2"
                    />
                    현금
                  </label>
                </div>
              </div>

              {/* 카드 선택 */}
              {formData.paymentMethod === 'card' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">카드 선택</label>
                    {cards.length > 0 ? (
                      <select
                        value={formData.cardId}
                        onChange={(e) => setFormData({ ...formData, cardId: e.target.value, isInstallment: false })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">카드 선택</option>
                        {cards.map((card) => (
                          <option key={card.id} value={card.id}>
                            {card.name} ({card.type === 'credit' ? '신용' : '체크'})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-500 p-2 bg-gray-50 rounded-lg">
                        등록된 카드가 없습니다. 자산 페이지에서 카드를 먼저 등록하세요.
                      </p>
                    )}
                  </div>

                  {/* 신용카드일 때: 일시불/할부 선택 */}
                  {isCredit && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">결제방식</label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={!formData.isInstallment}
                            onChange={() => setFormData({ ...formData, isInstallment: false })}
                            className="mr-2"
                          />
                          일시불
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={formData.isInstallment}
                            onChange={() => setFormData({ ...formData, isInstallment: true })}
                            className="mr-2"
                          />
                          할부
                        </label>
                      </div>
                    </div>
                  )}

                  {/* 할부 개월 */}
                  {isCredit && formData.isInstallment && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">할부 개월</label>
                      <select
                        value={formData.installmentMonths}
                        onChange={(e) => setFormData({ ...formData, installmentMonths: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36].map((m) => (
                          <option key={m} value={m.toString()}>{m}개월</option>
                        ))}
                      </select>
                      {amount > 0 && (
                        <p className="mt-2 p-2 bg-gray-50 rounded-lg text-sm">
                          월 납입액: <strong>{formatKRW(monthlyAmount)}</strong>
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
            <input
              type="text"
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              placeholder="메모 (선택)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
