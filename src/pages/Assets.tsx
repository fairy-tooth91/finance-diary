import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Modal } from '../components/common/Modal';
import { formatKRW, formatDateInput, getValueColor } from '../utils/format';
import { ASSET_TYPES, LOAN_TYPES, CARD_LIST } from '../types';
import type { Asset, Loan } from '../types';

type TabType = 'assets' | 'loans' | 'installments';

export function Assets() {
  const {
    assets,
    loans,
    installments,
    addAsset,
    updateAsset,
    deleteAsset,
    addLoan,
    updateLoan,
    deleteLoan,
    addInstallment,
    deleteInstallment,
    getUpcomingInstallments,
    getMonthlyInstallmentTotal,
    getTotalNetWorth,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<TabType>('assets');
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

  const netWorth = getTotalNetWorth();
  const upcomingInstallments = getUpcomingInstallments();
  const monthlyInstallmentTotal = getMonthlyInstallmentTotal();

  // Asset form
  const [assetForm, setAssetForm] = useState({
    name: '',
    type: 'cash' as Asset['type'],
    amount: '',
    institution: '',
    memo: '',
  });

  // Loan form
  const [loanForm, setLoanForm] = useState({
    name: '',
    type: 'credit' as Loan['type'],
    principal: '',
    remainingBalance: '',
    interestRate: '',
    monthlyPayment: '',
    startDate: formatDateInput(),
    endDate: '',
    institution: '',
    memo: '',
  });

  // Installment form
  const [installmentForm, setInstallmentForm] = useState({
    itemName: '',
    cardName: CARD_LIST[0] as string,
    totalAmount: '',
    totalMonths: '',
    startDate: formatDateInput(),
    paymentDay: '15',
    memo: '',
  });

  const handleAddAsset = () => {
    if (editingAsset) {
      updateAsset(editingAsset.id, {
        name: assetForm.name,
        type: assetForm.type,
        amount: parseFloat(assetForm.amount) || 0,
        institution: assetForm.institution,
        memo: assetForm.memo,
      });
    } else {
      addAsset({
        name: assetForm.name,
        type: assetForm.type,
        amount: parseFloat(assetForm.amount) || 0,
        institution: assetForm.institution,
        memo: assetForm.memo,
      });
    }
    setIsAssetModalOpen(false);
    setEditingAsset(null);
    setAssetForm({ name: '', type: 'cash', amount: '', institution: '', memo: '' });
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetForm({
      name: asset.name,
      type: asset.type,
      amount: asset.amount.toString(),
      institution: asset.institution || '',
      memo: asset.memo,
    });
    setIsAssetModalOpen(true);
  };

  const handleAddLoan = () => {
    if (editingLoan) {
      updateLoan(editingLoan.id, {
        name: loanForm.name,
        type: loanForm.type,
        principal: parseFloat(loanForm.principal) || 0,
        remainingBalance: parseFloat(loanForm.remainingBalance) || 0,
        interestRate: parseFloat(loanForm.interestRate) || 0,
        monthlyPayment: parseFloat(loanForm.monthlyPayment) || 0,
        startDate: loanForm.startDate,
        endDate: loanForm.endDate || undefined,
        institution: loanForm.institution,
        memo: loanForm.memo,
      });
    } else {
      addLoan({
        name: loanForm.name,
        type: loanForm.type,
        principal: parseFloat(loanForm.principal) || 0,
        remainingBalance: parseFloat(loanForm.remainingBalance) || 0,
        interestRate: parseFloat(loanForm.interestRate) || 0,
        monthlyPayment: parseFloat(loanForm.monthlyPayment) || 0,
        startDate: loanForm.startDate,
        endDate: loanForm.endDate || undefined,
        institution: loanForm.institution,
        memo: loanForm.memo,
      });
    }
    setIsLoanModalOpen(false);
    setEditingLoan(null);
    setLoanForm({
      name: '', type: 'credit', principal: '', remainingBalance: '',
      interestRate: '', monthlyPayment: '', startDate: formatDateInput(),
      endDate: '', institution: '', memo: '',
    });
  };

  const handleEditLoan = (loan: Loan) => {
    setEditingLoan(loan);
    setLoanForm({
      name: loan.name,
      type: loan.type,
      principal: loan.principal.toString(),
      remainingBalance: loan.remainingBalance.toString(),
      interestRate: loan.interestRate.toString(),
      monthlyPayment: loan.monthlyPayment.toString(),
      startDate: loan.startDate,
      endDate: loan.endDate || '',
      institution: loan.institution,
      memo: loan.memo,
    });
    setIsLoanModalOpen(true);
  };

  const handleAddInstallment = async () => {
    const totalAmount = parseFloat(installmentForm.totalAmount) || 0;
    const totalMonths = parseInt(installmentForm.totalMonths) || 1;
    const monthlyAmount = Math.round(totalAmount / totalMonths);

    await addInstallment({
      itemName: installmentForm.itemName,
      cardName: installmentForm.cardName,
      totalAmount,
      monthlyAmount,
      totalMonths,
      startDate: installmentForm.startDate,
      paymentDay: parseInt(installmentForm.paymentDay) || 15,
      memo: installmentForm.memo,
    });

    setIsInstallmentModalOpen(false);
    setInstallmentForm({
      itemName: '', cardName: CARD_LIST[0], totalAmount: '',
      totalMonths: '', startDate: formatDateInput(), paymentDay: '15', memo: '',
    });
  };

  const tabs = [
    { id: 'assets' as TabType, label: '자산', count: assets.length },
    { id: 'loans' as TabType, label: '대출', count: loans.length },
    { id: 'installments' as TabType, label: '할부', count: installments.filter(i => i.paidMonths < i.totalMonths).length },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">총 자산</h3>
          <p className="mt-1 text-xl font-bold text-blue-600">
            {formatKRW(netWorth.totalAssets + netWorth.totalInvestment)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">총 대출</h3>
          <p className="mt-1 text-xl font-bold text-red-600">
            {formatKRW(netWorth.totalLoans)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">순자산</h3>
          <p className={`mt-1 text-xl font-bold ${getValueColor(netWorth.netWorth)}`}>
            {formatKRW(netWorth.netWorth)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">이번 달 할부금</h3>
          <p className="mt-1 text-xl font-bold text-orange-600">
            {formatKRW(monthlyInstallmentTotal)}
          </p>
        </div>
      </div>

      {/* Upcoming Installments Alert */}
      {upcomingInstallments.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-orange-800 mb-2">
            이번 달 결제 예정 할부
          </h3>
          <div className="space-y-2">
            {upcomingInstallments.map((inst) => (
              <div key={inst.id} className="flex justify-between text-sm">
                <span className="text-orange-700">
                  {inst.startDate.slice(5, 10)} {inst.itemName} ({inst.nextPaymentNumber}/{inst.totalMonths}회) - {inst.cardName}
                </span>
                <span className="font-medium text-orange-800">
                  {formatKRW(inst.monthlyAmount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Assets Tab */}
      {activeTab === 'assets' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingAsset(null);
                setAssetForm({ name: '', type: 'cash', amount: '', institution: '', memo: '' });
                setIsAssetModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              + 자산 추가
            </button>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200">
            {assets.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {assets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          {ASSET_TYPES[asset.type]}
                        </span>
                        <span className="font-medium">{asset.name}</span>
                      </div>
                      {asset.institution && (
                        <p className="text-sm text-gray-500 mt-1">{asset.institution}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-blue-600">{formatKRW(asset.amount)}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditAsset(asset)}
                          className="text-gray-400 hover:text-blue-500 text-sm"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => deleteAsset(asset.id)}
                          className="text-gray-400 hover:text-red-500 text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">등록된 자산이 없습니다.</div>
            )}
          </div>
        </div>
      )}

      {/* Loans Tab */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingLoan(null);
                setLoanForm({
                  name: '', type: 'credit', principal: '', remainingBalance: '',
                  interestRate: '', monthlyPayment: '', startDate: formatDateInput(),
                  endDate: '', institution: '', memo: '',
                });
                setIsLoanModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              + 대출 추가
            </button>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200">
            {loans.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {loans.map((loan) => (
                  <div key={loan.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                            {LOAN_TYPES[loan.type]}
                          </span>
                          <span className="font-medium">{loan.name}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{loan.institution}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">
                          {formatKRW(loan.remainingBalance)}
                        </p>
                        <p className="text-sm text-gray-500">
                          월 {formatKRW(loan.monthlyPayment)} / 이자 {loan.interestRate}%
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => handleEditLoan(loan)}
                        className="text-gray-400 hover:text-blue-500 text-sm"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => deleteLoan(loan.id)}
                        className="text-gray-400 hover:text-red-500 text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">등록된 대출이 없습니다.</div>
            )}
          </div>
        </div>
      )}

      {/* Installments Tab */}
      {activeTab === 'installments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsInstallmentModalOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              + 할부 등록
            </button>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200">
            {installments.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {installments.map((inst) => {
                  const isCompleted = inst.paidMonths >= inst.totalMonths;
                  const remainingAmount = (inst.totalMonths - inst.paidMonths) * inst.monthlyAmount;

                  return (
                    <div
                      key={inst.id}
                      className={`p-4 ${isCompleted ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{inst.itemName}</span>
                            {isCompleted && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                완납
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {inst.cardName} · 매월 {inst.paymentDay}일 결제 · {inst.startDate} 시작
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {inst.paidMonths}/{inst.totalMonths}회 ({formatKRW(inst.monthlyAmount)}/월)
                          </p>
                          {!isCompleted && (
                            <p className="text-sm text-orange-600">
                              잔여: {formatKRW(remainingAmount)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${(inst.paidMonths / inst.totalMonths) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => deleteInstallment(inst.id)}
                          className="text-gray-400 hover:text-red-500 text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">등록된 할부가 없습니다.</div>
            )}
          </div>
        </div>
      )}

      {/* Asset Modal */}
      <Modal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        title={editingAsset ? '자산 수정' : '자산 추가'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">자산명</label>
            <input
              type="text"
              value={assetForm.name}
              onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
              placeholder="예: 급여 통장"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
            <select
              value={assetForm.type}
              onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value as Asset['type'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(ASSET_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">금액 (원)</label>
            <input
              type="number"
              value={assetForm.amount}
              onChange={(e) => setAssetForm({ ...assetForm, amount: e.target.value })}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">금융기관 (선택)</label>
            <input
              type="text"
              value={assetForm.institution}
              onChange={(e) => setAssetForm({ ...assetForm, institution: e.target.value })}
              placeholder="예: 신한은행"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
            <input
              type="text"
              value={assetForm.memo}
              onChange={(e) => setAssetForm({ ...assetForm, memo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsAssetModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleAddAsset}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {editingAsset ? '수정' : '추가'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Loan Modal */}
      <Modal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        title={editingLoan ? '대출 수정' : '대출 추가'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대출명</label>
            <input
              type="text"
              value={loanForm.name}
              onChange={(e) => setLoanForm({ ...loanForm, name: e.target.value })}
              placeholder="예: 전세자금대출"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
            <select
              value={loanForm.type}
              onChange={(e) => setLoanForm({ ...loanForm, type: e.target.value as Loan['type'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(LOAN_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">원금</label>
              <input
                type="number"
                value={loanForm.principal}
                onChange={(e) => setLoanForm({ ...loanForm, principal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">잔액</label>
              <input
                type="number"
                value={loanForm.remainingBalance}
                onChange={(e) => setLoanForm({ ...loanForm, remainingBalance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이자율 (%)</label>
              <input
                type="number"
                step="0.01"
                value={loanForm.interestRate}
                onChange={(e) => setLoanForm({ ...loanForm, interestRate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">월 상환액</label>
              <input
                type="number"
                value={loanForm.monthlyPayment}
                onChange={(e) => setLoanForm({ ...loanForm, monthlyPayment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">금융기관</label>
            <input
              type="text"
              value={loanForm.institution}
              onChange={(e) => setLoanForm({ ...loanForm, institution: e.target.value })}
              placeholder="예: 국민은행"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대출 시작일</label>
            <input
              type="date"
              value={loanForm.startDate}
              onChange={(e) => setLoanForm({ ...loanForm, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsLoanModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleAddLoan}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {editingLoan ? '수정' : '추가'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Installment Modal */}
      <Modal
        isOpen={isInstallmentModalOpen}
        onClose={() => setIsInstallmentModalOpen(false)}
        title="할부 등록"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">품목명</label>
            <input
              type="text"
              value={installmentForm.itemName}
              onChange={(e) => setInstallmentForm({ ...installmentForm, itemName: e.target.value })}
              placeholder="예: 노트북"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">카드</label>
            <select
              value={installmentForm.cardName}
              onChange={(e) => setInstallmentForm({ ...installmentForm, cardName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CARD_LIST.map((card) => (
                <option key={card} value={card}>{card}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">총 금액</label>
              <input
                type="number"
                value={installmentForm.totalAmount}
                onChange={(e) => setInstallmentForm({ ...installmentForm, totalAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">할부 개월</label>
              <input
                type="number"
                value={installmentForm.totalMonths}
                onChange={(e) => setInstallmentForm({ ...installmentForm, totalMonths: e.target.value })}
                placeholder="12"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {installmentForm.totalAmount && installmentForm.totalMonths && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              월 납입액: <strong>{formatKRW(Math.round(parseFloat(installmentForm.totalAmount) / parseInt(installmentForm.totalMonths)))}</strong>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">첫 결제일</label>
              <input
                type="date"
                value={installmentForm.startDate}
                onChange={(e) => setInstallmentForm({ ...installmentForm, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">매월 결제일</label>
              <input
                type="number"
                min="1"
                max="31"
                value={installmentForm.paymentDay}
                onChange={(e) => setInstallmentForm({ ...installmentForm, paymentDay: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
            <input
              type="text"
              value={installmentForm.memo}
              onChange={(e) => setInstallmentForm({ ...installmentForm, memo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            첫 결제일에 가계부 지출로 자동 등록됩니다.
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsInstallmentModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleAddInstallment}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              등록
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
