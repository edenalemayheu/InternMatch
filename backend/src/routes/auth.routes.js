import { Router } from 'express';
import { getCurrentRound } from '../db/queries/rounds.js';

const router = Router();

// GET /api/rounds/current  (public)
router.get('/rounds/current', async (req, res, next) => {
  try {
    res.json(await getCurrentRound());
  } catch (err) {
    next(err);
  }
});

// TODO (step 2): POST /api/auth/signup, POST /api/auth/login
// See docs/api/endpoints.md and docs/function-level-specification/admin-and-auth.md §1

export default router;
