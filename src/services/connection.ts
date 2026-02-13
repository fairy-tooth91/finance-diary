/**
 * DB 연결 테스트
 */
import { supabase } from './client';

export async function testConnection(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').select('id').eq('id', userId).limit(1);
    return !error;
  } catch {
    return false;
  }
}
