/**
 * 포트폴리오 서비스
 */
import { supabase } from './client';
import type { PortfolioHolding } from '../types';

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

function fromPortfolio(h: PortfolioHolding, userId: string) {
  return {
    user_id: userId,
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

export async function fetchPortfolio(userId: string): Promise<PortfolioHolding[]> {
  const { data, error } = await supabase.from('portfolio').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(toPortfolio);
}

export async function upsertPortfolio(userId: string, holdings: PortfolioHolding[]): Promise<void> {
  if (holdings.length === 0) return;
  const { error } = await supabase
    .from('portfolio')
    .upsert(holdings.map((h) => fromPortfolio(h, userId)), {
      onConflict: 'stock_code,user_id',
    });
  if (error) throw error;
}

export async function deletePortfolioByStockCode(userId: string, stockCode: string): Promise<void> {
  const { error } = await supabase
    .from('portfolio')
    .delete()
    .eq('stock_code', stockCode)
    .eq('user_id', userId);
  if (error) throw error;
}
