import { Router } from 'express';
import { getCurrentRound } from '../db/queries/rounds.js';
import { supabase } from '../db/supabaseClient.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
const shapeUser = (row, hasProfile = false) => ({ id: row.id, email: row.email, role: row.role, is_admin: !!row.is_admin, hasProfile: !!row.is_admin || hasProfile });
const shapeSession = (session, user) => ({ token: session.access_token, refresh_token: session.refresh_token, expires_at: session.expires_at, user });
const validation = (res, fields) => res.status(400).json({ error: 'Validation failed', fields });
async function hasProfile(user) {
  if (user.is_admin) return true;
  const { data, error } = await supabase.from(user.role === 'student' ? 'students' : 'companies').select('id').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return !!data;
}

router.get('/rounds/current', async (req, res, next) => {
  try {
    const round = await getCurrentRound();
    if (!round) return res.status(404).json({ error: 'No active round' });
    return res.json({ round });
  } catch (err) { return next(err); }
});

router.post('/auth/signup', async (req, res, next) => {
  const { email, password, role } = req.body || {};
  const fields = {};
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) fields.email = 'Enter a valid email';
  if (typeof password !== 'string' || password.length < 8) fields.password = 'Must be at least 8 characters';
  if (!['student', 'company'].includes(role)) fields.role = 'Choose student or company';
  if (Object.keys(fields).length) return validation(res, fields);
  try {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { role }, app_metadata: { role } });
    if (createError) return res.status(/already|registered/i.test(createError.message) ? 409 : 400).json({ error: /already|registered/i.test(createError.message) ? 'Email already registered' : 'Could not create account' });
    const authUser = created.user;
    const { error: dbError } = await supabase.from('users').insert({ id: authUser.id, email, role, is_admin: false });
    if (dbError) { await supabase.auth.admin.deleteUser(authUser.id); throw dbError; }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw Object.assign(new Error('Could not start session'), { status: 503 });
    return res.status(201).json(shapeSession(data.session, shapeUser({ ...authUser, email, role, is_admin: false })));
  } catch (err) { return next(err); }
});

router.post('/auth/login', async (req, res, next) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') return validation(res, { email: 'Email and password are required' });
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user || !data.session) return res.status(401).json({ error: 'Invalid email or password' });
    const { data: row, error: dbError } = await supabase.from('users').select('id,email,role,is_admin').eq('id', data.user.id).maybeSingle();
    if (dbError) throw dbError;
    if (!row) return res.status(401).json({ error: 'Invalid email or password' });
    return res.json(shapeSession(data.session, shapeUser(row, await hasProfile(row))));
  } catch (err) { return next(err); }
});

router.post('/auth/refresh', async (req, res, next) => {
  const refresh_token = req.body?.refresh_token;
  if (typeof refresh_token !== 'string' || !refresh_token) return res.status(401).json({ error: 'Invalid or expired session' });
  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error || !data.user || !data.session) return res.status(401).json({ error: 'Invalid or expired session' });
    const { data: row, error: dbError } = await supabase.from('users').select('id,email,role,is_admin').eq('id', data.user.id).maybeSingle();
    if (dbError) throw dbError;
    if (!row) return res.status(401).json({ error: 'Invalid or expired session' });
    return res.json(shapeSession(data.session, shapeUser(row, await hasProfile(row))));
  } catch (err) { return next(err); }
});

router.get('/auth/me', requireAuth, async (req, res, next) => {
  try { return res.json({ user: shapeUser(req.user, await hasProfile(req.user)) }); }
  catch (err) { return next(err); }
});

router.post('/auth/logout', requireAuth, async (req, res) => {
  try { await supabase.auth.admin.signOut(req.headers.authorization.slice(7), 'global'); } catch { /* local client still discards its tokens */ }
  return res.json({ ok: true });
});

export default router;
