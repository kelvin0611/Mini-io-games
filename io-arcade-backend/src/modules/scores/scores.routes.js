import { Router } from 'express';
import { submitScore, getLeaderboard } from './scores.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { scoreLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/:gameId', requireAuth, scoreLimiter, submitScore);
router.get('/leaderboard/:gameId', getLeaderboard);

export default router;