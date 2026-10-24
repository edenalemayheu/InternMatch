import { Router } from 'express';
import { getCurrentRound } from '../db/queries/rounds.js';

const router = Router();

// GET /api/rounds/current  (public)
router.get('/rounds/current', async (req, res, next) => {
  try {
    const round = await getCurrentRound();
    if (!round) return res.status(404).json({ error: 'No active round' });
    res.json({ round });
  } catch (err) {
    next(err);
  }
});

// TODO (step 2): POST /api/auth/signup, /auth/login, /auth/refresh, /auth/logout, GET /auth/me
// See docs/api/endpoints.md and docs/function-level-specification/admin-and-auth.md §1

export default router;
