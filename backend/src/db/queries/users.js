import { supabase } from '../supabaseClient.js';

export async function getUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, is_admin')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data; // null if no row
}
