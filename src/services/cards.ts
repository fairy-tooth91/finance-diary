/**
 * 카드 서비스
 */
import { supabase } from './client';
import type { Card } from '../types';

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

function fromCard(c: Omit<Card, 'id'> & { id?: string }, userId: string) {
  return {
    ...(c.id ? { id: c.id } : {}),
    user_id: userId,
    name: c.name,
    company: c.company,
    type: c.type,
    billing_day: c.billingDay || null,
    linked_asset_id: c.linkedAssetId || null,
    memo: c.memo || '',
  };
}

function cardUpdatesToDb(updates: Partial<Card>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (updates.name !== undefined) db.name = updates.name;
  if (updates.company !== undefined) db.company = updates.company;
  if (updates.type !== undefined) db.type = updates.type;
  if (updates.billingDay !== undefined) db.billing_day = updates.billingDay;
  if (updates.linkedAssetId !== undefined) db.linked_asset_id = updates.linkedAssetId;
  if (updates.memo !== undefined) db.memo = updates.memo;
  return db;
}

export async function fetchCards(userId: string): Promise<Card[]> {
  const { data, error } = await supabase.from('cards').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(toCard);
}

export async function createCard(userId: string, card: Card): Promise<Card> {
  const { data, error } = await supabase
    .from('cards')
    .insert(fromCard(card, userId))
    .select()
    .single();
  if (error) throw error;
  return toCard(data);
}

export async function updateCard(id: string, updates: Partial<Card>): Promise<void> {
  const { error } = await supabase.from('cards').update(cardUpdatesToDb(updates)).eq('id', id);
  if (error) throw error;
}

export async function deleteCard(id: string): Promise<void> {
  const { error } = await supabase.from('cards').delete().eq('id', id);
  if (error) throw error;
}
