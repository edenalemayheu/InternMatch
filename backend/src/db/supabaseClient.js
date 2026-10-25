// Single shared Supabase client for the backend.
// Uses the SECRET service_role key, which bypasses Row Level Security.
// All access control is enforced in our own middleware/services (see docs/).
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = process.env;
let client = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;
// Password sign-in and refresh mutate the Supabase client's Auth session and
// Authorization header. Keep them isolated from the service-role DB/admin client.
let passwordAuthClient = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

// All database/auth access is routed through this adapter. Tests can inject a
// deterministic in-memory implementation without importing a network client.
export const getSupabase = () => {
  if (!client) throw Object.assign(new Error('Supabase is not configured'), { status: 503 });
  return client;
};
export const signInWithPassword = (...args) => {
  if (!passwordAuthClient) throw Object.assign(new Error('Supabase is not configured'), { status: 503 });
  return passwordAuthClient.auth.signInWithPassword(...args);
};
export const refreshSession = (...args) => {
  if (!passwordAuthClient) throw Object.assign(new Error('Supabase is not configured'), { status: 503 });
  return passwordAuthClient.auth.refreshSession(...args);
};
export const setSupabaseForTests = (fakeClient, fakePasswordAuthClient = fakeClient) => {
  client = fakeClient;
  passwordAuthClient = fakePasswordAuthClient;
};
export const supabase = new Proxy({}, { get: (_target, key) => getSupabase()[key] });
