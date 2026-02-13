/**
 * 자산 서비스
 */
import { supabase } from './client';
import type { Asset } from '../types';

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

function fromAsset(a: Omit<Asset, 'id'> & { id?: string }, userId: string) {
  return {
    ...(a.id ? { id: a.id } : {}),
    user_id: userId,
    name: a.name,
    type: a.type,
    amount: a.amount,
    institution: a.institution || null,
    memo: a.memo || '',
    updated_at: a.updatedAt,
  };
}

function assetUpdatesToDb(updates: Partial<Asset>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (updates.name !== undefined) db.name = updates.name;
  if (updates.type !== undefined) db.type = updates.type;
  if (updates.amount !== undefined) db.amount = updates.amount;
  if (updates.institution !== undefined) db.institution = updates.institution;
  if (updates.memo !== undefined) db.memo = updates.memo;
  if (updates.updatedAt !== undefined) db.updated_at = updates.updatedAt;
  return db;
}

export async function fetchAssets(userId: string): Promise<Asset[]> {
  const { data, error } = await supabase.from('assets').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(toAsset);
}

export async function createAsset(userId: string, asset: Asset): Promise<Asset> {
  const { data, error } = await supabase
    .from('assets')
    .insert(fromAsset(asset, userId))
    .select()
    .single();
  if (error) throw error;
  return toAsset(data);
}

export async function updateAsset(id: string, updates: Partial<Asset>): Promise<void> {
  const { error } = await supabase.from('assets').update(assetUpdatesToDb(updates)).eq('id', id);
  if (error) throw error;
}

export async function deleteAsset(id: string): Promise<void> {
  const { error } = await supabase.from('assets').delete().eq('id', id);
  if (error) throw error;
}
