import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Transaction, StockTrade, PortfolioHolding, PriceHistory, Asset, Loan, Installment, Card } from '../types';
import {
  fetchTransactions, createTransaction, deleteTransaction as deleteTransactionSvc,
  fetchAssets, createAsset as createAssetSvc, updateAsset as updateAssetSvc, deleteAsset as deleteAssetSvc,
  fetchLoans, createLoan as createLoanSvc, updateLoan as updateLoanSvc, deleteLoan as deleteLoanSvc,
  fetchCards, createCard as createCardSvc, updateCard as updateCardSvc, deleteCard as deleteCardSvc,
  fetchInstallments, createInstallment as createInstallmentSvc, updateInstallment as updateInstallmentSvc, deleteInstallment as deleteInstallmentSvc,
  fetchStockTrades, createStockTrade as createStockTradeSvc, deleteStockTrade as deleteStockTradeSvc,
  fetchPortfolio, upsertPortfolio, deletePortfolioByStockCode,
  fetchPriceHistory, upsertPriceHistory,
  yahooFinanceService,
} from '../services';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

export function useFinanceData(userId?: string) {
  const uid = useMemo(() => userId || DEFAULT_USER_ID, [userId]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stockTrades, setStockTrades] = useState<StockTrade[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioHolding[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  // Fetch all data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [txns, trades, port, prices, assts, lns, insts, crds] = await Promise.all([
          fetchTransactions(uid),
          fetchStockTrades(uid),
          fetchPortfolio(uid),
          fetchPriceHistory(uid),
          fetchAssets(uid),
          fetchLoans(uid),
          fetchInstallments(uid),
          fetchCards(uid),
        ]);
        setTransactions(txns);
        setStockTrades(trades);
        setPortfolio(port);
        setPriceHistory(prices);
        setAssets(assts);
        setLoans(lns);
        setInstallments(insts);
        setCards(crds);
        setIsConnected(true);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('데이터 로딩에 실패했습니다. 인터넷 연결을 확인하세요.');
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [uid]);

  // ============================================
  // Transaction operations
  // ============================================

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'> & { installmentId?: string }) => {
    setError(null);
    try {
      const newTransaction: Transaction = { ...transaction, id: generateId() };
      setTransactions((prev) => [...prev, newTransaction]);
      await createTransaction(uid, newTransaction);
      return true;
    } catch (err) {
      console.error('Failed to add transaction:', err);
      setError('거래 추가에 실패했습니다.');
      return false;
    }
  }, [uid]);

  const removeTransaction = useCallback(async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTransactionSvc(id);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  }, []);

  // ============================================
  // Stock trade operations
  // ============================================

  const addStockTrade = useCallback(async (trade: Omit<StockTrade, 'id' | 'total'>) => {
    setError(null);
    try {
      const total = trade.quantity * trade.price;
      const fullTrade: StockTrade = { ...trade, total, id: generateId() };

      setStockTrades((prev) => [...prev, fullTrade]);
      await createStockTradeSvc(uid, fullTrade);

      updatePortfolioFromTrade(fullTrade);

      return true;
    } catch (err) {
      console.error('Failed to add stock trade:', err);
      setError('주식 매매 추가에 실패했습니다.');
      return false;
    }
  }, [uid]);

  const removeStockTrade = useCallback(async (id: string) => {
    setStockTrades((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteStockTradeSvc(id);
    } catch (err) {
      console.error('Failed to delete stock trade:', err);
    }
  }, []);

  // ============================================
  // Portfolio operations
  // ============================================

  const updatePortfolioFromTrade = useCallback((trade: StockTrade) => {
    setPortfolio((prev) => {
      const existingIndex = prev.findIndex((h) => h.stockCode === trade.stockCode);
      let updated: PortfolioHolding[];

      if (trade.tradeType === 'buy') {
        if (existingIndex >= 0) {
          const existing = prev[existingIndex];
          const newQuantity = existing.quantity + trade.quantity;
          const newAvgPrice =
            (existing.avgPrice * existing.quantity + trade.price * trade.quantity) / newQuantity;

          updated = [...prev];
          updated[existingIndex] = {
            ...existing,
            quantity: newQuantity,
            avgPrice: newAvgPrice,
          };
        } else {
          updated = [
            ...prev,
            {
              stockName: trade.stockName,
              stockCode: trade.stockCode,
              quantity: trade.quantity,
              avgPrice: trade.price,
              currentPrice: trade.price,
              highPrice: trade.price,
              dropFromHigh: 0,
              profitRate: 0,
            },
          ];
        }
      } else {
        if (existingIndex >= 0) {
          const existing = prev[existingIndex];
          const newQuantity = existing.quantity - trade.quantity;

          if (newQuantity <= 0) {
            updated = prev.filter((_, i) => i !== existingIndex);
            deletePortfolioByStockCode(uid, trade.stockCode).catch(console.error);
            return updated;
          } else {
            updated = [...prev];
            updated[existingIndex] = {
              ...existing,
              quantity: newQuantity,
            };
          }
        } else {
          return prev;
        }
      }

      upsertPortfolio(uid, updated).catch(console.error);
      return updated;
    });
  }, [uid]);

  const refreshPrices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const updatedPortfolio = [...portfolio];
      const newPriceHistory: PriceHistory[] = [];

      for (const holding of updatedPortfolio) {
        const quote = await yahooFinanceService.getQuote(holding.stockCode);
        if (quote) {
          holding.currentPrice = quote.regularMarketPrice;

          const historical = await yahooFinanceService.getHistoricalPrices(holding.stockCode, '3mo');
          const highWatermark = yahooFinanceService.calculateHighWatermark(historical);

          holding.highPrice = Math.max(holding.highPrice, highWatermark, quote.regularMarketPrice);
          holding.dropFromHigh = yahooFinanceService.calculateDropFromHigh(
            holding.currentPrice,
            holding.highPrice
          );
          holding.profitRate = ((holding.currentPrice - holding.avgPrice) / holding.avgPrice) * 100;

          newPriceHistory.push({
            date: today,
            stockCode: holding.stockCode,
            closePrice: holding.currentPrice,
          });
        }
      }

      setPortfolio(updatedPortfolio);

      if (newPriceHistory.length > 0) {
        setPriceHistory((prev) => {
          const filtered = prev.filter((p) => p.date !== today);
          return [...filtered, ...newPriceHistory];
        });

        await upsertPortfolio(uid, updatedPortfolio);
        await upsertPriceHistory(uid, newPriceHistory);
      }

      return true;
    } catch {
      setError('시세 갱신에 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [portfolio, uid]);

  const getDropAlerts = useCallback((threshold: number = -10) => {
    return portfolio.filter((h) => h.dropFromHigh <= threshold);
  }, [portfolio]);

  // ============================================
  // Asset operations
  // ============================================

  const addAsset = useCallback(async (asset: Omit<Asset, 'id' | 'updatedAt'>) => {
    const newAsset: Asset = {
      ...asset,
      id: generateId(),
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setAssets((prev) => [...prev, newAsset]);
    try {
      await createAssetSvc(uid, newAsset);
    } catch (err) {
      console.error('Failed to add asset:', err);
    }
    return true;
  }, [uid]);

  const updateAsset = useCallback(async (id: string, updates: Partial<Asset>) => {
    const updatesWithDate = { ...updates, updatedAt: new Date().toISOString().split('T')[0] };
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updatesWithDate } : a))
    );
    try {
      await updateAssetSvc(id, updatesWithDate);
    } catch (err) {
      console.error('Failed to update asset:', err);
    }
  }, []);

  const deleteAsset = useCallback(async (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteAssetSvc(id);
    } catch (err) {
      console.error('Failed to delete asset:', err);
    }
  }, []);

  // ============================================
  // Loan operations
  // ============================================

  const addLoan = useCallback(async (loan: Omit<Loan, 'id'>) => {
    const newLoan: Loan = { ...loan, id: generateId() };
    setLoans((prev) => [...prev, newLoan]);
    try {
      await createLoanSvc(uid, newLoan);
    } catch (err) {
      console.error('Failed to add loan:', err);
    }
    return true;
  }, [uid]);

  const updateLoan = useCallback(async (id: string, updates: Partial<Loan>) => {
    setLoans((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    try {
      await updateLoanSvc(id, updates);
    } catch (err) {
      console.error('Failed to update loan:', err);
    }
  }, []);

  const deleteLoan = useCallback(async (id: string) => {
    setLoans((prev) => prev.filter((l) => l.id !== id));
    try {
      await deleteLoanSvc(id);
    } catch (err) {
      console.error('Failed to delete loan:', err);
    }
  }, []);

  // ============================================
  // Card operations
  // ============================================

  const addCard = useCallback(async (card: Omit<Card, 'id'>) => {
    const newCard: Card = { ...card, id: generateId() };
    setCards((prev) => [...prev, newCard]);
    try {
      await createCardSvc(uid, newCard);
    } catch (err) {
      console.error('Failed to add card:', err);
    }
    return newCard;
  }, [uid]);

  const updateCard = useCallback(async (id: string, updates: Partial<Card>) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    try {
      await updateCardSvc(id, updates);
    } catch (err) {
      console.error('Failed to update card:', err);
    }
  }, []);

  const deleteCard = useCallback(async (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteCardSvc(id);
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  }, []);

  // ============================================
  // Installment operations
  // ============================================

  const addInstallment = useCallback(async (
    installment: Omit<Installment, 'id' | 'paidMonths'>
  ) => {
    const newInstallment: Installment = {
      ...installment,
      id: generateId(),
      paidMonths: 1,
    };
    setInstallments((prev) => [...prev, newInstallment]);
    try {
      await createInstallmentSvc(uid, newInstallment);
    } catch (err) {
      console.error('Failed to add installment:', err);
    }

    await addTransaction({
      date: installment.startDate,
      type: 'expense',
      category: installment.category,
      amount: installment.monthlyAmount,
      memo: `${installment.itemName} (1/${installment.totalMonths}회) - ${installment.cardName}`,
      paymentMethod: 'card',
      cardId: installment.cardId,
      installmentId: newInstallment.id,
    });
    return true;
  }, [uid, addTransaction]);

  const updateInstallment = useCallback(async (id: string, updates: Partial<Installment>) => {
    setInstallments((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    try {
      await updateInstallmentSvc(id, updates);
    } catch (err) {
      console.error('Failed to update installment:', err);
    }
  }, []);

  const deleteInstallment = useCallback(async (id: string) => {
    setInstallments((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteInstallmentSvc(id);
    } catch (err) {
      console.error('Failed to delete installment:', err);
    }
  }, []);

  // ============================================
  // Computed values
  // ============================================

  const getUpcomingInstallments = useCallback(() => {
    const today = new Date();
    const currentDay = today.getDate();

    return installments
      .filter((inst) => {
        if (inst.paidMonths >= inst.totalMonths) return false;
        if (inst.paymentDay === currentDay) return false;
        return true;
      })
      .map((inst) => ({
        ...inst,
        nextPaymentNumber: inst.paidMonths + 1,
        remainingMonths: inst.totalMonths - inst.paidMonths,
        remainingAmount: (inst.totalMonths - inst.paidMonths) * inst.monthlyAmount,
      }));
  }, [installments]);

  const getInstallmentsForMonth = useCallback((yearMonth: string) => {
    const [viewYear, viewMonth] = yearMonth.split('-').map(Number);

    return installments
      .map((inst) => {
        const [startYear, startMonth] = inst.startDate.split('-').map(Number);
        const paymentNumber = (viewYear - startYear) * 12 + (viewMonth - startMonth) + 1;

        if (paymentNumber < 1 || paymentNumber > inst.totalMonths) return null;

        const remainingMonths = inst.totalMonths - paymentNumber;
        return {
          ...inst,
          paymentNumber,
          remainingMonths,
          remainingAmount: remainingMonths * inst.monthlyAmount,
          isLastPayment: paymentNumber === inst.totalMonths,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [installments]);

  const getMonthlyInstallmentTotal = useCallback(() => {
    return installments
      .filter((inst) => inst.paidMonths < inst.totalMonths)
      .reduce((sum, inst) => sum + inst.monthlyAmount, 0);
  }, [installments]);

  const getTotalNetWorth = useCallback(() => {
    const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);
    const totalInvestment = portfolio.reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);
    const totalLoans = loans.reduce((sum, l) => sum + l.remainingBalance, 0);
    const installmentDebt = installments
      .filter((i) => i.paidMonths < i.totalMonths)
      .reduce((sum, i) => sum + (i.totalMonths - i.paidMonths) * i.monthlyAmount, 0);
    return {
      totalAssets,
      totalInvestment,
      totalLoans,
      installmentDebt,
      netWorth: totalAssets + totalInvestment - totalLoans - installmentDebt,
    };
  }, [assets, portfolio, loans, installments]);

  const getSummary = useCallback(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = monthlyTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalAssets = portfolio.reduce(
      (sum, h) => sum + h.currentPrice * h.quantity,
      0
    );

    const totalCost = portfolio.reduce(
      (sum, h) => sum + h.avgPrice * h.quantity,
      0
    );

    const totalProfitLoss = totalAssets - totalCost;
    const totalProfitRate = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

    return {
      monthlyIncome,
      monthlyExpense,
      monthlyNet: monthlyIncome - monthlyExpense,
      totalAssets,
      totalCost,
      totalProfitLoss,
      totalProfitRate,
      holdingsCount: portfolio.length,
      alertCount: getDropAlerts().length,
    };
  }, [transactions, portfolio, getDropAlerts]);

  return {
    // State
    isLoading,
    error,
    isConnected,
    transactions,
    stockTrades,
    portfolio,
    priceHistory,
    assets,
    loans,
    installments,
    cards,

    // Operations
    addTransaction,
    deleteTransaction: removeTransaction,
    addStockTrade,
    deleteStockTrade: removeStockTrade,
    refreshPrices,
    getDropAlerts,
    getSummary,
    addAsset,
    updateAsset,
    deleteAsset,
    addLoan,
    updateLoan,
    deleteLoan,
    addCard,
    updateCard,
    deleteCard,
    addInstallment,
    updateInstallment,
    deleteInstallment,
    getUpcomingInstallments,
    getInstallmentsForMonth,
    getMonthlyInstallmentTotal,
    getTotalNetWorth,
  };
}
