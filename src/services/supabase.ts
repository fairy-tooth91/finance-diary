import { createClient } from '@supabase/supabase-js';
import type {
  Transaction,
  StockTrade,
  PortfolioHolding,
  PriceHistory,
  Asset,
  Loan,
  Installment,
  Card,
} from '../types';

const SUPABASE_URL = 'https://afypqjipbjjdmzevsxow.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JfpFFaQEUk6icD8JzI4OUg_xYipY3iA';

// 기본 사용자 ID (인증 기능 추가 전까지 사용)
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 현재 사용자 ID (향후 인증 연동 시 동적으로 변경)
export function getCurrentUserId(): string {
  return DEFAULT_USER_ID;
}

// ============================================
// Mapping helpers (snake_case DB ↔ camelCase TS)
// ============================================

// --- Transaction ---
function toTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    date: row.date as string,
    type: row.type as 'income' | 'expense',
    category: row.category as string,
    amount: Number(row.amount),
    memo: (row.memo as string) || '',
    paymentMethod: row.payment_method as Transaction['paymentMethod'],
    cardId: row.card_id as string | undefined,
    installmentId: row.installment_id as string | undefined,
  };
}

function fromTransaction(tx: Omit<Transaction, 'id'> & { id?: string }) {
  return {
    ...(tx.id ? { id: tx.id } : {}),
    user_id: getCurrentUserId(),
    date: tx.date,
    type: tx.type,
    category: tx.category,
    amount: tx.amount,
    memo: tx.memo || '',
    payment_method: tx.paymentMethod || null,
    card_id: tx.cardId || null,
    installment_id: tx.installmentId || null,
  };
}

// --- Asset ---
function toAsset(row: Record<string, unknown>): Asset {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as Asset['type'],
    amount: Number(row.amount),
    institution: row.institution as string | undefined,
    memo: (row.memo as string) || '',
    updatedAt: row.updated_at as string,
  };
}

function fromAsset(a: Omit<Asset, 'id'> & { id?: string }) {
  return {
    ...(a.id ? { id: a.id } : {}),
    user_id: getCurrentUserId(),
    name: a.name,
    type: a.type,
    amount: a.amount,
    institution: a.institution || null,
    memo: a.memo || '',
    updated_at: a.updatedAt,
  };
}

// --- Loan ---
function toLoan(row: Record<string, unknown>): Loan {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as Loan['type'],
    principal: Number(row.principal),
    remainingBalance: Number(row.remaining_balance),
    interestRate: Number(row.interest_rate),
    monthlyPayment: Number(row.monthly_payment),
    startDate: row.start_date as string,
    endDate: row.end_date as string | undefined,
    institution: row.institution as string,
    memo: (row.memo as string) || '',
  };
}

function fromLoan(l: Omit<Loan, 'id'> & { id?: string }) {
  return {
    ...(l.id ? { id: l.id } : {}),
    user_id: getCurrentUserId(),
    name: l.name,
    type: l.type,
    principal: l.principal,
    remaining_balance: l.remainingBalance,
    interest_rate: l.interestRate,
    monthly_payment: l.monthlyPayment,
    start_date: l.startDate,
    end_date: l.endDate || null,
    institution: l.institution,
    memo: l.memo || '',
  };
}

// --- Card ---
function toCard(row: Record<string, unknown>): Card {
  return {
    id: row.id as string,
    name: row.name as string,
    company: row.company as string,
    type: row.type as Card['type'],
    billingDay: row.billing_day as number | undefined,
    linkedAssetId: row.linked_asset_id as string | undefined,
    memo: (row.memo as string) || '',
  };
}

function fromCard(c: Omit<Card, 'id'> & { id?: string }) {
  return {
    ...(c.id ? { id: c.id } : {}),
    user_id: getCurrentUserId(),
    name: c.name,
    company: c.company,
    type: c.type,
    billing_day: c.billingDay || null,
    linked_asset_id: c.linkedAssetId || null,
    memo: c.memo || '',
  };
}

// --- Installment ---
function toInstallment(row: Record<string, unknown>): Installment {
  return {
    id: row.id as string,
    itemName: row.item_name as string,
    cardId: row.card_id as string,
    cardName: row.card_name as string,
    category: row.category as string,
    totalAmount: Number(row.total_amount),
    monthlyAmount: Number(row.monthly_amount),
    totalMonths: Number(row.total_months),
    paidMonths: Number(row.paid_months),
    startDate: row.start_date as string,
    paymentDay: Number(row.payment_day),
    memo: (row.memo as string) || '',
  };
}

function fromInstallment(i: Omit<Installment, 'id'> & { id?: string }) {
  return {
    ...(i.id ? { id: i.id } : {}),
    user_id: getCurrentUserId(),
    item_name: i.itemName,
    card_id: i.cardId,
    card_name: i.cardName,
    category: i.category,
    total_amount: i.totalAmount,
    monthly_amount: i.monthlyAmount,
    total_months: i.totalMonths,
    paid_months: i.paidMonths,
    start_date: i.startDate,
    payment_day: i.paymentDay,
    memo: i.memo || '',
  };
}

// --- StockTrade ---
function toStockTrade(row: Record<string, unknown>): StockTrade {
  return {
    id: row.id as string,
    date: row.date as string,
    stockName: row.stock_name as string,
    stockCode: row.stock_code as string,
    tradeType: row.trade_type as 'buy' | 'sell',
    quantity: Number(row.quantity),
    price: Number(row.price),
    total: Number(row.total),
    memo: (row.memo as string) || '',
  };
}

function fromStockTrade(t: Omit<StockTrade, 'id'> & { id?: string }) {
  return {
    ...(t.id ? { id: t.id } : {}),
    user_id: getCurrentUserId(),
    date: t.date,
    stock_name: t.stockName,
    stock_code: t.stockCode,
    trade_type: t.tradeType,
    quantity: t.quantity,
    price: t.price,
    total: t.total,
    memo: t.memo || '',
  };
}

// --- Portfolio ---
function toPortfolio(row: Record<string, unknown>): PortfolioHolding {
  return {
    stockName: row.stock_name as string,
    stockCode: row.stock_code as string,
    quantity: Number(row.quantity),
    avgPrice: Number(row.avg_price),
    currentPrice: Number(row.current_price),
    highPrice: Number(row.high_price),
    dropFromHigh: Number(row.drop_from_high),
    profitRate: Number(row.profit_rate),
  };
}

function fromPortfolio(h: PortfolioHolding) {
  return {
    user_id: getCurrentUserId(),
    stock_code: h.stockCode,
    stock_name: h.stockName,
    quantity: h.quantity,
    avg_price: h.avgPrice,
    current_price: h.currentPrice,
    high_price: h.highPrice,
    drop_from_high: h.dropFromHigh,
    profit_rate: h.profitRate,
  };
}

// --- PriceHistory ---
function toPriceHistory(row: Record<string, unknown>): PriceHistory {
  return {
    date: row.date as string,
    stockCode: row.stock_code as string,
    closePrice: Number(row.close_price),
  };
}

function fromPriceHistory(p: PriceHistory) {
  return {
    user_id: getCurrentUserId(),
    date: p.date,
    stock_code: p.stockCode,
    close_price: p.closePrice,
  };
}

// ============================================
// Service functions
// ============================================

export const supabaseService = {
  // --- Transactions ---
  async getTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', getCurrentUserId())
      .order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(toTransaction);
  },

  async addTransaction(tx: Omit<Transaction, 'id'> & { id: string }): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(fromTransaction(tx))
      .select()
      .single();
    if (error) throw error;
    return toTransaction(data);
  },

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Assets ---
  async getAssets(): Promise<Asset[]> {
    const { data, error } = await supabase.from('assets').select('*').eq('user_id', getCurrentUserId());
    if (error) throw error;
    return (data || []).map(toAsset);
  },

  async addAsset(asset: Asset): Promise<Asset> {
    const { data, error } = await supabase
      .from('assets')
      .insert(fromAsset(asset))
      .select()
      .single();
    if (error) throw error;
    return toAsset(data);
  },

  async updateAsset(id: string, updates: Partial<Asset>): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.institution !== undefined) dbUpdates.institution = updates.institution;
    if (updates.memo !== undefined) dbUpdates.memo = updates.memo;
    if (updates.updatedAt !== undefined) dbUpdates.updated_at = updates.updatedAt;
    const { error } = await supabase.from('assets').update(dbUpdates).eq('id', id);
    if (error) throw error;
  },

  async deleteAsset(id: string): Promise<void> {
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Loans ---
  async getLoans(): Promise<Loan[]> {
    const { data, error } = await supabase.from('loans').select('*').eq('user_id', getCurrentUserId());
    if (error) throw error;
    return (data || []).map(toLoan);
  },

  async addLoan(loan: Loan): Promise<Loan> {
    const { data, error } = await supabase
      .from('loans')
      .insert(fromLoan(loan))
      .select()
      .single();
    if (error) throw error;
    return toLoan(data);
  },

  async updateLoan(id: string, updates: Partial<Loan>): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.principal !== undefined) dbUpdates.principal = updates.principal;
    if (updates.remainingBalance !== undefined) dbUpdates.remaining_balance = updates.remainingBalance;
    if (updates.interestRate !== undefined) dbUpdates.interest_rate = updates.interestRate;
    if (updates.monthlyPayment !== undefined) dbUpdates.monthly_payment = updates.monthlyPayment;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
    if (updates.institution !== undefined) dbUpdates.institution = updates.institution;
    if (updates.memo !== undefined) dbUpdates.memo = updates.memo;
    const { error } = await supabase.from('loans').update(dbUpdates).eq('id', id);
    if (error) throw error;
  },

  async deleteLoan(id: string): Promise<void> {
    const { error } = await supabase.from('loans').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Cards ---
  async getCards(): Promise<Card[]> {
    const { data, error } = await supabase.from('cards').select('*').eq('user_id', getCurrentUserId());
    if (error) throw error;
    return (data || []).map(toCard);
  },

  async addCard(card: Card): Promise<Card> {
    const { data, error } = await supabase
      .from('cards')
      .insert(fromCard(card))
      .select()
      .single();
    if (error) throw error;
    return toCard(data);
  },

  async updateCard(id: string, updates: Partial<Card>): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.company !== undefined) dbUpdates.company = updates.company;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.billingDay !== undefined) dbUpdates.billing_day = updates.billingDay;
    if (updates.linkedAssetId !== undefined) dbUpdates.linked_asset_id = updates.linkedAssetId;
    if (updates.memo !== undefined) dbUpdates.memo = updates.memo;
    const { error } = await supabase.from('cards').update(dbUpdates).eq('id', id);
    if (error) throw error;
  },

  async deleteCard(id: string): Promise<void> {
    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Installments ---
  async getInstallments(): Promise<Installment[]> {
    const { data, error } = await supabase.from('installments').select('*').eq('user_id', getCurrentUserId());
    if (error) throw error;
    return (data || []).map(toInstallment);
  },

  async addInstallment(inst: Installment): Promise<Installment> {
    const { data, error } = await supabase
      .from('installments')
      .insert(fromInstallment(inst))
      .select()
      .single();
    if (error) throw error;
    return toInstallment(data);
  },

  async updateInstallment(id: string, updates: Partial<Installment>): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.itemName !== undefined) dbUpdates.item_name = updates.itemName;
    if (updates.cardId !== undefined) dbUpdates.card_id = updates.cardId;
    if (updates.cardName !== undefined) dbUpdates.card_name = updates.cardName;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
    if (updates.monthlyAmount !== undefined) dbUpdates.monthly_amount = updates.monthlyAmount;
    if (updates.totalMonths !== undefined) dbUpdates.total_months = updates.totalMonths;
    if (updates.paidMonths !== undefined) dbUpdates.paid_months = updates.paidMonths;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.paymentDay !== undefined) dbUpdates.payment_day = updates.paymentDay;
    if (updates.memo !== undefined) dbUpdates.memo = updates.memo;
    const { error } = await supabase.from('installments').update(dbUpdates).eq('id', id);
    if (error) throw error;
  },

  async deleteInstallment(id: string): Promise<void> {
    const { error } = await supabase.from('installments').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Stock Trades ---
  async getStockTrades(): Promise<StockTrade[]> {
    const { data, error } = await supabase
      .from('stock_trades')
      .select('*')
      .eq('user_id', getCurrentUserId())
      .order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(toStockTrade);
  },

  async addStockTrade(trade: StockTrade): Promise<StockTrade> {
    const { data, error } = await supabase
      .from('stock_trades')
      .insert(fromStockTrade(trade))
      .select()
      .single();
    if (error) throw error;
    return toStockTrade(data);
  },

  async deleteStockTrade(id: string): Promise<void> {
    const { error } = await supabase.from('stock_trades').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Portfolio ---
  async getPortfolio(): Promise<PortfolioHolding[]> {
    const { data, error } = await supabase.from('portfolio').select('*').eq('user_id', getCurrentUserId());
    if (error) throw error;
    return (data || []).map(toPortfolio);
  },

  async upsertPortfolio(holdings: PortfolioHolding[]): Promise<void> {
    if (holdings.length === 0) return;
    const { error } = await supabase
      .from('portfolio')
      .upsert(holdings.map(fromPortfolio), { onConflict: 'stock_code,user_id' });
    if (error) throw error;
  },

  async deletePortfolioHolding(stockCode: string): Promise<void> {
    const { error } = await supabase
      .from('portfolio')
      .delete()
      .eq('stock_code', stockCode)
      .eq('user_id', getCurrentUserId());
    if (error) throw error;
  },

  // --- Price History ---
  async getPriceHistory(): Promise<PriceHistory[]> {
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('user_id', getCurrentUserId())
      .order('date', { ascending: false })
      .limit(5000);
    if (error) throw error;
    return (data || []).map(toPriceHistory);
  },

  async addPriceHistory(entries: PriceHistory[]): Promise<void> {
    if (entries.length === 0) return;
    const { error } = await supabase
      .from('price_history')
      .upsert(entries.map(fromPriceHistory), { onConflict: 'user_id,date,stock_code' });
    if (error) throw error;
  },

  // --- Connection test ---
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from('users').select('id').eq('id', getCurrentUserId()).limit(1);
      return !error;
    } catch {
      return false;
    }
  },
};
