import { supabase } from '../supabaseClient.js';

export async function getCurrentRound() {
  const { data, error } = await supabase
    .from('rounds')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}
