/**
 * 주식매매 서비스
 */
import { supabase } from './client';
import type { StockTrade } from '../types';

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

function fromStockTrade(t: Omit<StockTrade, 'id'> & { id?: string }, userId: string) {
  return {
    ...(t.id ? { id: t.id } : {}),
    user_id: userId,
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

export async function fetchStockTrades(userId: string): Promise<StockTrade[]> {
  const { data, error } = await supabase
    .from('stock_trades')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(toStockTrade);
}

export async function createStockTrade(userId: string, trade: StockTrade): Promise<StockTrade> {
  const { data, error } = await supabase
    .from('stock_trades')
    .insert(fromStockTrade(trade, userId))
    .select()
    .single();
  if (error) throw error;
  return toStockTrade(data);
}

export async function deleteStockTrade(id: string): Promise<void> {
  const { error } = await supabase.from('stock_trades').delete().eq('id', id);
  if (error) throw error;
}
