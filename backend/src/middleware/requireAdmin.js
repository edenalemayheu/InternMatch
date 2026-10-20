// Must run AFTER requireAuth. req.user.is_admin was just re-read from the
// database by requireAuth, so this is a server-side check, not a client claim.
export function requireAdmin(req, res, next) {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}
