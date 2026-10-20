// Verifies the Supabase JWT in "Authorization: Bearer <token>" and loads the
// caller's row from our own `users` table onto req.user.
import { supabase } from '../db/supabaseClient.js';
import { getUserById } from '../db/queries/users.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid or expired session' });

    // Always read role/is_admin from the database, never from the client.
    const profile = await getUserById(data.user.id);
    if (!profile) return res.status(403).json({ error: 'Account setup incomplete' });

    req.user = profile;
    next();
  } catch (err) {
    next(err);
  }
}
