// Transaction types for household accounting
export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  memo: string;
  // 결제수단 (지출일 때만)
  paymentMethod?: 'cash' | 'card';
  cardId?: string;
  installmentId?: string;
}

// 자산 유형
export interface Asset {
  id: string;
  name: string;
  type: 'cash' | 'savings' | 'investment' | 'realestate' | 'other';
  amount: number;
  institution?: string; // 은행명, 증권사 등
  memo: string;
  updatedAt: string;
}

// 대출/부채
export interface Loan {
  id: string;
  name: string;
  type: 'mortgage' | 'credit' | 'personal' | 'other';
  principal: number; // 원금
  remainingBalance: number; // 잔액
  interestRate: number; // 이자율 (%)
  monthlyPayment: number; // 월 상환액
  startDate: string;
  endDate?: string;
  institution: string; // 금융기관
  memo: string;
}

// 카드 등록
export interface Card {
  id: string;
  name: string; // "신한 Deep On", "국민 My WE:SH"
  company: string; // 카드사 (CARD_LIST에서 선택)
  type: 'debit' | 'credit';
  billingDay?: number; // 결제일 (신용카드만, 1-31)
  linkedAssetId?: string; // 결제 출금 계좌 (Asset ID)
  memo: string;
}

// 카드 할부
export interface Installment {
  id: string;
  itemName: string; // 품목명
  cardId: string; // 등록된 카드 ID
  cardName: string; // 카드명 (표시용)
  category: string; // 지출 카테고리
  totalAmount: number; // 총 금액
  monthlyAmount: number; // 월 납입액
  totalMonths: number; // 총 할부 개월
  paidMonths: number; // 납입 완료 개월
  startDate: string; // 첫 결제일
  paymentDay: number; // 매월 결제일 (1-31)
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

export const ASSET_TYPES = {
  cash: '현금',
  savings: '예적금',
  investment: '투자자산',
  realestate: '부동산',
  other: '기타',
} as const;

export const LOAN_TYPES = {
  mortgage: '주택담보대출',
  credit: '신용대출',
  personal: '개인대출',
  other: '기타',
} as const;

export const CARD_LIST = [
  '삼성카드',
  '신한카드',
  '현대카드',
  'KB국민카드',
  '롯데카드',
  '우리카드',
  '하나카드',
  'NH농협카드',
  '기타',
] as const;

