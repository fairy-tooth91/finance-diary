/**
 * 할부 서비스
 */
import { supabase } from './client';
import type { Installment } from '../types';

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

function fromInstallment(i: Omit<Installment, 'id'> & { id?: string }, userId: string) {
  return {
    ...(i.id ? { id: i.id } : {}),
    user_id: userId,
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

function installmentUpdatesToDb(updates: Partial<Installment>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (updates.itemName !== undefined) db.item_name = updates.itemName;
  if (updates.cardId !== undefined) db.card_id = updates.cardId;
  if (updates.cardName !== undefined) db.card_name = updates.cardName;
  if (updates.category !== undefined) db.category = updates.category;
  if (updates.totalAmount !== undefined) db.total_amount = updates.totalAmount;
  if (updates.monthlyAmount !== undefined) db.monthly_amount = updates.monthlyAmount;
  if (updates.totalMonths !== undefined) db.total_months = updates.totalMonths;
  if (updates.paidMonths !== undefined) db.paid_months = updates.paidMonths;
  if (updates.startDate !== undefined) db.start_date = updates.startDate;
  if (updates.paymentDay !== undefined) db.payment_day = updates.paymentDay;
  if (updates.memo !== undefined) db.memo = updates.memo;
  return db;
}

export async function fetchInstallments(userId: string): Promise<Installment[]> {
  const { data, error } = await supabase.from('installments').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(toInstallment);
}

export async function createInstallment(userId: string, inst: Installment): Promise<Installment> {
  const { data, error } = await supabase
    .from('installments')
    .insert(fromInstallment(inst, userId))
    .select()
    .single();
  if (error) throw error;
  return toInstallment(data);
}

export async function updateInstallment(id: string, updates: Partial<Installment>): Promise<void> {
  const { error } = await supabase.from('installments').update(installmentUpdatesToDb(updates)).eq('id', id);
  if (error) throw error;
}

export async function deleteInstallment(id: string): Promise<void> {
  const { error } = await supabase.from('installments').delete().eq('id', id);
  if (error) throw error;
}
