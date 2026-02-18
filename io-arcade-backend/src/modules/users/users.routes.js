import { Router } from 'express';
import { getProfile, updateLoadout } from './users.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

router.get('/me', requireAuth, getProfile);
router.patch('/me/loadout', requireAuth, updateLoadout);

export default router;