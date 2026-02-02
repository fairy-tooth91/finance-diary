// Transaction types for household accounting
export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  memo: string;
}

// Stock trade types
export interface StockTrade {
  id: string;
  date: string;
  stockName: string;
  stockCode: string;
  tradeType: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  memo: string;
}

// Portfolio holding
export interface PortfolioHolding {
  stockName: string;
  stockCode: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  highPrice: number;
  dropFromHigh: number;
  profitRate: number;
}

// Price history entry
export interface PriceHistory {
  date: string;
  stockCode: string;
  closePrice: number;
}

// Category options
export const EXPENSE_CATEGORIES = [
  '식비',
  '교통',
  '쇼핑',
  '주거/통신',
  '문화/여가',
  '의료/건강',
  '교육',
  '기타'
] as const;

export const INCOME_CATEGORIES = [
  '급여',
  '부수입',
  '투자수익',
  '기타'
] as const;

// Google Sheets config
export interface SheetsConfig {
  spreadsheetId: string;
  apiKey: string;
  clientId: string;
}
