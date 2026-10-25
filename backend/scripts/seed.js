import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'node:url';

export const demoAccounts = [
  { email: 'admin@internmatch.demo', password: 'Admin123!', role: 'student', admin: true, name: 'Demo Admin' },
  { email: 'company1@internmatch.demo', password: 'Company123!', role: 'company', name: 'Northstar Labs' },
  { email: 'company2@internmatch.demo', password: 'Company123!', role: 'company', name: 'Greenfield Analytics' },
  ...['Alex Kim', 'Jordan Lee', 'Sam Rivera', 'Taylor Morgan'].map((name, i) => ({ email: `student${i + 1}@internmatch.demo`, password: 'Student123!', role: 'student', name })),
];

export async function ensureDemoAuthAccount(db, account) {
  const list = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (list.error) throw list.error;
  const existing = list.data.users.find((user) => user.email?.trim().toLowerCase() === account.email.toLowerCase());
  const authFields = {
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: { role: account.role },
    app_metadata: { role: account.role },
  };
  let user;
  if (existing) {
    const updated = await db.auth.admin.updateUserById(existing.id, authFields);
    if (updated.error) throw updated.error;
    user = updated.data.user;
  } else {
    const created = await db.auth.admin.createUser(authFields);
    if (created.error) throw created.error;
    user = created.data.user;
  }
  const profile = await db.from('users').upsert({
    id: user.id,
    email: account.email,
    role: account.role,
    is_admin: !!account.admin,
  }, { onConflict: 'id' });
  if (profile.error) throw profile.error;
  return user;
}

export async function seedDemoData(db, log = console.log) {
  const users = [];
  for (const account of demoAccounts) users.push(await ensureDemoAuthAccount(db, account));

  for (let i = 1; i <= 2; i++) {
    const account = demoAccounts[i];
    const user = users[i];
    const result = await db.from('companies').upsert({
      user_id: user.id,
      company_name: account.name,
      industry: i === 1 ? 'Software' : 'Data & Analytics',
      contact_person: i === 1 ? 'Morgan Chen' : 'Casey Patel',
    }, { onConflict: 'user_id' });
    if (result.error) throw result.error;
  }

  for (let i = 3; i < demoAccounts.length; i++) {
    const account = demoAccounts[i];
    const user = users[i];
    const result = await db.from('students').upsert({
      user_id: user.id,
      full_name: account.name,
      department: i % 2 ? 'Computer Science' : 'Data Science',
      year: '3rd year',
      skills: i % 2 ? ['React', 'Node.js'] : ['Python', 'SQL'],
      availability: 'Full-time summer',
      contact_email: account.email,
    }, { onConflict: 'user_id' });
    if (result.error) throw result.error;
  }

  let active = await db.from('rounds').select('id').order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (active.error) throw active.error;
  if (!active.data) {
    const created = await db.from('rounds').insert({ label: 'InternMatch Demo', phase: 'ranking_open' }).select('id').single();
    if (created.error) throw created.error;
    active = { data: created.data, error: null };
  }

  const companies = await db.from('companies').select('id,company_name').in('user_id', users.slice(1, 3).map((user) => user.id));
  if (companies.error) throw companies.error;
  for (let i = 0; i < companies.data.length; i++) {
    const company = companies.data[i];
    const title = company.company_name === 'Northstar Labs' ? 'Frontend Engineering Intern' : 'Data Analytics Intern';
    const found = await db.from('postings').select('id').eq('company_id', company.id).eq('round_id', active.data.id).eq('title', title).maybeSingle();
    if (found.error) throw found.error;
    const result = found.data
      ? await db.from('postings').update({ required_department: '', required_skills: ['React', 'SQL'], capacity: 2 }).eq('id', found.data.id)
      : await db.from('postings').insert({ company_id: company.id, round_id: active.data.id, title, required_department: '', required_skills: ['React', 'SQL'], capacity: 2 });
    if (result.error) throw result.error;
  }

  const postings = await db.from('postings').select('id').eq('round_id', active.data.id);
  if (postings.error) throw postings.error;
  const students = await db.from('students').select('id').in('user_id', users.slice(3).map((user) => user.id));
  if (students.error) throw students.error;
  const postingIds = (postings.data || []).map((posting) => posting.id);
  for (const [index, student] of (students.data || []).entries()) {
    const orderedPostingIds = index % 2 ? postingIds.slice().reverse() : postingIds;
    const result = await db.from('student_rankings').upsert({ student_id: student.id, round_id: active.data.id, ordered_posting_ids: orderedPostingIds }, { onConflict: 'student_id,round_id' });
    if (result.error) throw result.error;
  }

  log('Demo accounts (passwords are for local/demo use only):');
  for (const account of demoAccounts) log(`  ${account.role}${account.admin ? ' admin' : ''}: ${account.email} / ${account.password}`);
  return { users, roundId: active.data.id };
}

async function main() {
  const force = process.argv.includes('--force');
  if (process.env.NODE_ENV === 'production' && !force) throw new Error('Refusing to seed production. Pass --force to override.');
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  await seedDemoData(db);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  });
}
