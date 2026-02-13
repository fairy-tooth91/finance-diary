/**
 * 거래(수입/지출) 서비스
 */
import { supabase } from './client';
import type { Transaction } from '../types';

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

function fromTransaction(tx: Omit<Transaction, 'id'> & { id?: string }, userId: string) {
  return {
    ...(tx.id ? { id: tx.id } : {}),
    user_id: userId,
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

export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(toTransaction);
}

export async function createTransaction(userId: string, tx: Omit<Transaction, 'id'> & { id: string }): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert(fromTransaction(tx, userId))
    .select()
    .single();
  if (error) throw error;
  return toTransaction(data);
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}
