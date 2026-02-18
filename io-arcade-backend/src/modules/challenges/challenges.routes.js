import { Router } from 'express';
import { getDailyChallenges } from './challenges.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

router.get('/daily', requireAuth, getDailyChallenges);

export default router;