import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const [emailArg, password] = process.argv.slice(2);
if (!emailArg || !password) {
  console.error('Usage: node scripts/check-login.js <email> <password>');
  process.exit(2);
}

const email = emailArg.trim().toLowerCase();
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('FAIL configuration: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env');
  process.exit(2);
}

const authKeyName = SUPABASE_ANON_KEY ? 'SUPABASE_ANON_KEY' : 'SUPABASE_SERVICE_ROLE_KEY (current backend behavior)';
const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const dbClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const fail = (step, error) => {
  console.log(`FAIL ${step}: ${error?.code || 'UNKNOWN'}: ${error?.message || String(error)}`);
  process.exit(1);
};

console.log(`Login flow diagnostic for ${email}`);
console.log(`Password sign-in client: ${authKeyName}`);
let signIn;
try {
  signIn = await authClient.auth.signInWithPassword({ email, password });
} catch (error) {
  fail('sign-in', error);
}
if (signIn.error || !signIn.data.user || !signIn.data.session) fail('sign-in', signIn.error || new Error('Supabase returned no user or session'));
console.log(`PASS sign-in: user id ${signIn.data.user.id}; session returned (credentials omitted)`);

let lookup;
try {
  lookup = await dbClient.from('users').select('id,email,role,is_admin').eq('id', signIn.data.user.id).maybeSingle();
} catch (error) {
  fail('profile lookup', error);
}
if (lookup.error) fail('profile lookup', lookup.error);
if (!lookup.data) fail('profile lookup', Object.assign(new Error('No public.users row found for authenticated user'), { code: 'PROFILE_NOT_FOUND' }));
console.log(`PASS profile lookup: ${JSON.stringify(lookup.data)}`);

const row = lookup.data;
let profileLookup = { data: null, error: null };
let profileByEmail = null;
if (!row.is_admin) {
  const table = row.role === 'student' ? 'students' : row.role === 'company' ? 'companies' : null;
  if (!table) fail('role resolution', Object.assign(new Error(`Unsupported profile role: ${row.role}`), { code: 'INVALID_PROFILE_ROLE' }));
  try {
    profileLookup = await dbClient.from(table).select('id').eq('user_id', row.id).maybeSingle();
    if (table === 'students' && !profileLookup.data && !profileLookup.error) {
      profileByEmail = await dbClient.from(table).select('id,user_id,contact_email').eq('contact_email', email).maybeSingle();
    }
  } catch (error) {
    fail('role resolution', error);
  }
  if (profileLookup.error) fail('role resolution', profileLookup.error);
  if (profileByEmail?.error) fail('role resolution contact-email lookup', profileByEmail.error);
}
console.log(`PASS role resolution: ${JSON.stringify({ role: row.role, is_admin: !!row.is_admin, hasProfile: !!row.is_admin || !!profileLookup.data, profileTable: row.is_admin ? null : row.role === 'student' ? 'students' : 'companies', profileLookup: row.is_admin ? 'skipped for admin' : { data: profileLookup.data, error: profileLookup.error }, studentContactEmailMatch: profileByEmail ? { data: profileByEmail.data, error: profileByEmail.error } : undefined })}`);
console.log('PASS complete: login flow can return a session');
