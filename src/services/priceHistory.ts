/**
 * 가격 이력 서비스
 */
import { supabase } from './client';
import type { PriceHistory } from '../types';

function toPriceHistory(row: Record<string, unknown>): PriceHistory {
  return {
    date: row.date as string,
    stockCode: row.stock_code as string,
    closePrice: Number(row.close_price),
  };
}

function fromPriceHistory(p: PriceHistory, userId: string) {
  return {
    user_id: userId,
    date: p.date,
    stock_code: p.stockCode,
    close_price: p.closePrice,
  };
}

export async function fetchPriceHistory(userId: string): Promise<PriceHistory[]> {
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(5000);
  if (error) throw error;
  return (data || []).map(toPriceHistory);
}

export async function upsertPriceHistory(userId: string, entries: PriceHistory[]): Promise<void> {
  if (entries.length === 0) return;
  const { error } = await supabase
    .from('price_history')
    .upsert(entries.map((e) => fromPriceHistory(e, userId)), {
      onConflict: 'user_id,date,stock_code',
    });
  if (error) throw error;
}
