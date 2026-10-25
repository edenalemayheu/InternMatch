// Single shared Supabase client for the backend.
// Uses the SECRET service_role key, which bypasses Row Level Security.
// All access control is enforced in our own middleware/services (see docs/).
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
let client = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

// All database/auth access is routed through this adapter. Tests can inject a
// deterministic in-memory implementation without importing a network client.
export const getSupabase = () => {
  if (!client) throw Object.assign(new Error('Supabase is not configured'), { status: 503 });
  return client;
};
export const setSupabaseForTests = (fakeClient) => { client = fakeClient; };
export const supabase = new Proxy({}, { get: (_target, key) => getSupabase()[key] });
