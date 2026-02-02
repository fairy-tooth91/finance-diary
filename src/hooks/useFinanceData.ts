import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Transaction, StockTrade, PortfolioHolding, PriceHistory, Asset, Loan, Installment } from '../types';
import { sheetsService } from '../services/googleSheets';
import { yahooFinanceService } from '../services/yahooFinance';

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function useFinanceData() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useSheetsApi, setUseSheetsApi] = useLocalStorage('useSheetsApi', false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Local storage data
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [stockTrades, setStockTrades] = useLocalStorage<StockTrade[]>('stockTrades', []);
  const [portfolio, setPortfolio] = useLocalStorage<PortfolioHolding[]>('portfolio', []);
  const [priceHistory, setPriceHistory] = useLocalStorage<PriceHistory[]>('priceHistory', []);
  const [assets, setAssets] = useLocalStorage<Asset[]>('assets', []);
  const [loans, setLoans] = useLocalStorage<Loan[]>('loans', []);
  const [installments, setInstallments] = useLocalStorage<Installment[]>('installments', []);

  // Google Sheets config
  const [sheetsConfig, setSheetsConfig] = useLocalStorage('sheetsConfig', {
    spreadsheetId: '',
    apiKey: '',
    clientId: '',
  });

  // Initialize Google Sheets
  const initializeSheets = useCallback(async () => {
    if (!sheetsConfig.spreadsheetId || !sheetsConfig.apiKey || !sheetsConfig.clientId) {
      return false;
    }
    sheetsService.setConfig(
      sheetsConfig.spreadsheetId,
      sheetsConfig.apiKey,
      sheetsConfig.clientId
    );
    sheetsService.setAuthChangeCallback(setIsAuthorized);
    return await sheetsService.initialize();
  }, [sheetsConfig]);

  const authorizeSheets = useCallback(async () => {
    setIsLoading(true);
    try {
      const success = await sheetsService.authorize();
      setIsAuthorized(success);
      return success;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Transaction operations
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'> & { installmentId?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      if (useSheetsApi && isAuthorized) {
        await sheetsService.addTransaction(transaction);
      }
      const newTransaction = { ...transaction, id: generateId() };
      setTransactions((prev) => [...prev, newTransaction]);
      return true;
    } catch (err) {
      setError('Failed to add transaction');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [useSheetsApi, isAuthorized, setTransactions]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, [setTransactions]);

  // Stock trade operations
  const addStockTrade = useCallback(async (trade: Omit<StockTrade, 'id' | 'total'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const total = trade.quantity * trade.price;
      const fullTrade = { ...trade, total, id: generateId() };

      if (useSheetsApi && isAuthorized) {
        await sheetsService.addStockTrade(fullTrade);
      }
      setStockTrades((prev) => [...prev, fullTrade]);

      // Update portfolio
      updatePortfolioFromTrade(fullTrade);

      return true;
    } catch (err) {
      setError('Failed to add stock trade');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [useSheetsApi, isAuthorized, setStockTrades]);

  const deleteStockTrade = useCallback((id: string) => {
    setStockTrades((prev) => prev.filter((t) => t.id !== id));
  }, [setStockTrades]);

  // Portfolio operations
  const updatePortfolioFromTrade = useCallback((trade: StockTrade) => {
    setPortfolio((prev) => {
      const existingIndex = prev.findIndex((h) => h.stockCode === trade.stockCode);

      if (trade.tradeType === 'buy') {
        if (existingIndex >= 0) {
          // Update existing holding
          const existing = prev[existingIndex];
          const newQuantity = existing.quantity + trade.quantity;
          const newAvgPrice =
            (existing.avgPrice * existing.quantity + trade.price * trade.quantity) / newQuantity;

          const updated = [...prev];
          updated[existingIndex] = {
            ...existing,
            quantity: newQuantity,
            avgPrice: newAvgPrice,
          };
          return updated;
        } else {
          // Add new holding
          return [
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
        // Sell
        if (existingIndex >= 0) {
          const existing = prev[existingIndex];
          const newQuantity = existing.quantity - trade.quantity;

          if (newQuantity <= 0) {
            // Remove holding
            return prev.filter((_, i) => i !== existingIndex);
          } else {
            const updated = [...prev];
            updated[existingIndex] = {
              ...existing,
              quantity: newQuantity,
            };
            return updated;
          }
        }
        return prev;
      }
    });
  }, [setPortfolio]);

  // Refresh prices from Yahoo Finance
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

          // Get historical data for high watermark
          const historical = await yahooFinanceService.getHistoricalPrices(holding.stockCode, '3mo');
          const highWatermark = yahooFinanceService.calculateHighWatermark(historical);

          // Update high price if current is higher
          holding.highPrice = Math.max(holding.highPrice, highWatermark, quote.regularMarketPrice);

          // Calculate drop from high
          holding.dropFromHigh = yahooFinanceService.calculateDropFromHigh(
            holding.currentPrice,
            holding.highPrice
          );

          // Calculate profit rate
          holding.profitRate = ((holding.currentPrice - holding.avgPrice) / holding.avgPrice) * 100;

          // Add to price history
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
          // Remove today's entries and add new ones
          const filtered = prev.filter((p) => p.date !== today);
          return [...filtered, ...newPriceHistory];
        });

        if (useSheetsApi && isAuthorized) {
          await sheetsService.updatePortfolio(updatedPortfolio);
          await sheetsService.addPriceHistory(newPriceHistory);
        }
      }

      return true;
    } catch (err) {
      setError('Failed to refresh prices');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [portfolio, setPortfolio, setPriceHistory, useSheetsApi, isAuthorized]);

  // Sync with Google Sheets
  const syncWithSheets = useCallback(async () => {
    if (!useSheetsApi || !isAuthorized) return false;

    setIsLoading(true);
    setError(null);
    try {
      const [sheetTransactions, sheetTrades, sheetPortfolio, sheetHistory] = await Promise.all([
        sheetsService.getTransactions(),
        sheetsService.getStockTrades(),
        sheetsService.getPortfolio(),
        sheetsService.getPriceHistory(),
      ]);

      setTransactions(sheetTransactions);
      setStockTrades(sheetTrades);
      setPortfolio(sheetPortfolio);
      setPriceHistory(sheetHistory);

      return true;
    } catch (err) {
      setError('Failed to sync with Google Sheets');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [useSheetsApi, isAuthorized, setTransactions, setStockTrades, setPortfolio, setPriceHistory]);

  // Get alerts for holdings dropping more than threshold
  const getDropAlerts = useCallback((threshold: number = -10) => {
    return portfolio.filter((h) => h.dropFromHigh <= threshold);
  }, [portfolio]);

  // Asset operations
  const addAsset = useCallback((asset: Omit<Asset, 'id' | 'updatedAt'>) => {
    const newAsset: Asset = {
      ...asset,
      id: generateId(),
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setAssets((prev) => [...prev, newAsset]);
    return true;
  }, [setAssets]);

  const updateAsset = useCallback((id: string, updates: Partial<Asset>) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : a
      )
    );
  }, [setAssets]);

  const deleteAsset = useCallback((id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }, [setAssets]);

  // Loan operations
  const addLoan = useCallback((loan: Omit<Loan, 'id'>) => {
    const newLoan: Loan = { ...loan, id: generateId() };
    setLoans((prev) => [...prev, newLoan]);
    return true;
  }, [setLoans]);

  const updateLoan = useCallback((id: string, updates: Partial<Loan>) => {
    setLoans((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }, [setLoans]);

  const deleteLoan = useCallback((id: string) => {
    setLoans((prev) => prev.filter((l) => l.id !== id));
  }, [setLoans]);

  // Installment operations
  const addInstallment = useCallback(async (
    installment: Omit<Installment, 'id' | 'paidMonths'>,
    addToTransaction: boolean = true
  ) => {
    const newInstallment: Installment = {
      ...installment,
      id: generateId(),
      paidMonths: 1, // 첫 결제 완료
    };
    setInstallments((prev) => [...prev, newInstallment]);

    // 첫 결제를 가계부에 추가
    if (addToTransaction) {
      await addTransaction({
        date: installment.startDate,
        type: 'expense',
        category: '할부',
        amount: installment.monthlyAmount,
        memo: `${installment.itemName} (1/${installment.totalMonths}회) - ${installment.cardName}`,
        installmentId: newInstallment.id,
      });
    }
    return true;
  }, [setInstallments, addTransaction]);

  const updateInstallment = useCallback((id: string, updates: Partial<Installment>) => {
    setInstallments((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  }, [setInstallments]);

  const deleteInstallment = useCallback((id: string) => {
    setInstallments((prev) => prev.filter((i) => i.id !== id));
  }, [setInstallments]);

  // 이번 달 결제 예정 할부 목록 (결제 당일 제외)
  const getUpcomingInstallments = useCallback(() => {
    const today = new Date();
    const currentDay = today.getDate();

    return installments
      .filter((inst) => {
        // 완납된 할부 제외
        if (inst.paidMonths >= inst.totalMonths) return false;
        // 결제 당일 제외
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

  // 이번 달 총 할부금
  const getMonthlyInstallmentTotal = useCallback(() => {
    return installments
      .filter((inst) => inst.paidMonths < inst.totalMonths)
      .reduce((sum, inst) => sum + inst.monthlyAmount, 0);
  }, [installments]);

  // 총 자산 계산 (자산 - 대출)
  const getTotalNetWorth = useCallback(() => {
    const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);
    const totalInvestment = portfolio.reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);
    const totalLoans = loans.reduce((sum, l) => sum + l.remainingBalance, 0);
    return {
      totalAssets,
      totalInvestment,
      totalLoans,
      netWorth: totalAssets + totalInvestment - totalLoans,
    };
  }, [assets, portfolio, loans]);

  // Summary calculations
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
    useSheetsApi,
    isAuthorized,
    transactions,
    stockTrades,
    portfolio,
    priceHistory,
    assets,
    loans,
    installments,
    sheetsConfig,

    // Setters
    setUseSheetsApi,
    setSheetsConfig,

    // Operations
    initializeSheets,
    authorizeSheets,
    addTransaction,
    deleteTransaction,
    addStockTrade,
    deleteStockTrade,
    refreshPrices,
    syncWithSheets,
    getDropAlerts,
    getSummary,
    // Asset operations
    addAsset,
    updateAsset,
    deleteAsset,
    // Loan operations
    addLoan,
    updateLoan,
    deleteLoan,
    // Installment operations
    addInstallment,
    updateInstallment,
    deleteInstallment,
    getUpcomingInstallments,
    getMonthlyInstallmentTotal,
    getTotalNetWorth,
  };
}
