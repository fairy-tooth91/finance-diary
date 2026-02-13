/**
 * 대출 서비스
 */
import { supabase } from './client';
import type { Loan } from '../types';

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

function fromLoan(l: Omit<Loan, 'id'> & { id?: string }, userId: string) {
  return {
    ...(l.id ? { id: l.id } : {}),
    user_id: userId,
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

function loanUpdatesToDb(updates: Partial<Loan>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (updates.name !== undefined) db.name = updates.name;
  if (updates.type !== undefined) db.type = updates.type;
  if (updates.principal !== undefined) db.principal = updates.principal;
  if (updates.remainingBalance !== undefined) db.remaining_balance = updates.remainingBalance;
  if (updates.interestRate !== undefined) db.interest_rate = updates.interestRate;
  if (updates.monthlyPayment !== undefined) db.monthly_payment = updates.monthlyPayment;
  if (updates.startDate !== undefined) db.start_date = updates.startDate;
  if (updates.endDate !== undefined) db.end_date = updates.endDate;
  if (updates.institution !== undefined) db.institution = updates.institution;
  if (updates.memo !== undefined) db.memo = updates.memo;
  return db;
}

export async function fetchLoans(userId: string): Promise<Loan[]> {
  const { data, error } = await supabase.from('loans').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(toLoan);
}

export async function createLoan(userId: string, loan: Loan): Promise<Loan> {
  const { data, error } = await supabase
    .from('loans')
    .insert(fromLoan(loan, userId))
    .select()
    .single();
  if (error) throw error;
  return toLoan(data);
}

export async function updateLoan(id: string, updates: Partial<Loan>): Promise<void> {
  const { error } = await supabase.from('loans').update(loanUpdatesToDb(updates)).eq('id', id);
  if (error) throw error;
}

export async function deleteLoan(id: string): Promise<void> {
  const { error } = await supabase.from('loans').delete().eq('id', id);
  if (error) throw error;
}
