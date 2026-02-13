/**
 * 서비스 레이어 엔트리포인트
 *
 * ⚠️ Supabase 의존은 이 폴더(services/) 내부로 격리됩니다.
 * 외부(context, hooks, components, pages)에서는 이 경로로만 import하세요.
 *
 * 백엔드 교체 시: 각 도메인 파일 내부의 supabase 호출을 fetch()로 변경
 */

// Auth
export {
  loginWithSocial,
  logout,
  getCurrentUser,
  onAuthStateChange,
} from './auth';
export type { AuthUser, SocialProvider } from './auth';

// Transactions
export {
  fetchTransactions,
  createTransaction,
  deleteTransaction,
} from './transactions';

// Assets
export {
  fetchAssets,
  createAsset,
  updateAsset,
  deleteAsset,
} from './assets';

// Loans
export {
  fetchLoans,
  createLoan,
  updateLoan,
  deleteLoan,
} from './loans';

// Cards
export {
  fetchCards,
  createCard,
  updateCard,
  deleteCard,
} from './cards';

// Installments
export {
  fetchInstallments,
  createInstallment,
  updateInstallment,
  deleteInstallment,
} from './installments';

// Stock Trades
export {
  fetchStockTrades,
  createStockTrade,
  deleteStockTrade,
} from './stockTrades';

// Portfolio
export {
  fetchPortfolio,
  upsertPortfolio,
  deletePortfolioByStockCode,
} from './portfolio';

// Price History
export {
  fetchPriceHistory,
  upsertPriceHistory,
} from './priceHistory';

// Connection
export { testConnection } from './connection';

// Yahoo Finance (외부 API - Supabase 무관)
export { yahooFinanceService } from './yahooFinance';
export type { MarketIndicator } from './yahooFinance';
